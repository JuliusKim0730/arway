# task_runner.py
import os
import sys
import time
import logging
import json
from pathlib import Path
from typing import Dict, List
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import schedule
import threading

# 상대 경로 임포트를 위한 경로 추가
sys.path.insert(0, str(Path(__file__).parent))

from workflow_processor import MDProcessingPipeline
from external_link_manager import ExternalLinkManager

class MLOpsTaskRunner:
    """자동 Task 실행 관리자"""
    
    def __init__(self, config_path: str = None):
        # 기본 경로 설정
        # task_runner.py는 00_MLOps_마스터/ 디렉토리에 있으므로
        # parent는 00_MLOps_마스터, parent.parent는 MLOps 디렉토리
        base_path = Path(__file__).parent.parent
        if config_path is None:
            # config.yaml은 00_MLOps_마스터/workflows/ 디렉토리에 있음
            config_path = Path(__file__).parent / "workflows" / "config.yaml"
        else:
            config_path = Path(config_path)
        
        if not config_path.exists():
            raise FileNotFoundError(
                f"설정 파일을 찾을 수 없습니다: {config_path}\n"
                f"현재 작업 디렉토리: {Path.cwd()}\n"
                f"스크립트 위치: {Path(__file__).parent}"
            )
        
        self.config = self._load_config(str(config_path))
        self.base_path = base_path
        
        # 경로를 절대 경로로 변환
        kb_path = self.config.get('knowledge_base_path', '01_지식베이스')
        if not Path(kb_path).is_absolute():
            kb_path = base_path / kb_path
        
        self.pipeline = MDProcessingPipeline(str(kb_path))
        self.link_manager = ExternalLinkManager(str(base_path / "02_메타데이터"))
        self.setup_logging()
    
    def setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('mlops_tasks.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def run_scheduled_tasks(self):
        """스케줄된 작업 실행"""
        schedule.every(1).hours.do(self.process_new_files)
        schedule.every(6).hours.do(self.update_external_links)
        schedule.every(24).hours.do(self.cleanup_old_artifacts)
        
        while True:
            schedule.run_pending()
            time.sleep(60)
    
    def process_new_files(self):
        """새 MD 파일 처리"""
        kb_path = self.config.get('knowledge_base_path', '01_지식베이스')
        knowledge_base = self.base_path / kb_path
        
        for md_file in knowledge_base.rglob('*.md'):
            if self._is_new_or_modified(md_file):
                self.logger.info(f"Processing {md_file}")
                try:
                    metadata = self.pipeline.process_md_file(str(md_file))
                    erd_path = self.pipeline.generate_erd(metadata)
                    prd_path = self.pipeline.generate_prd(metadata)
                    package_path = self.pipeline.generate_mlops_code(metadata, erd_path, prd_path)
                    self.logger.info(f"Generated package: {package_path}")
                except Exception as e:
                    self.logger.error(f"Error processing {md_file}: {e}")
    
    def update_external_links(self):
        """외부 링크 업데이트 및 코드 생성"""
        for link in self.link_manager.links:
            if link['type'] in ['huggingface', 'github']:
                code = self.link_manager.convert_to_code(link)
                if code:
                    self._save_external_code(link, code)
    
    def cleanup_old_artifacts(self):
        """오래된 아티팩트 정리"""
        # 30일 이상된 파일 정리
        import datetime
        cleanup_days = self.config.get('scheduling', {}).get('cleanup_days', 30)
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=cleanup_days)
        
        generated_path = self.base_path / self.config.get('generated_path', '03_생성된파일')
        for path in generated_path.rglob('*'):
            if path.is_file():
                mtime = datetime.datetime.fromtimestamp(path.stat().st_mtime)
                if mtime < cutoff_date:
                    path.unlink()
                    self.logger.info(f"Cleaned up: {path}")
    
    def _is_new_or_modified(self, file_path: Path) -> bool:
        """파일이 새롭거나 수정되었는지 확인"""
        # 메타데이터에서 확인
        metadata_file = self.base_path / self.config.get('metadata_path', '02_메타데이터') / "processed_files.json"
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                processed = json.load(f)
                file_hash = self.pipeline._generate_hash(str(file_path))
                return file_hash not in processed.get(str(file_path), {}).get('hash', '')
        return True
    
    def _save_external_code(self, link: Dict, code: str):
        """외부 링크 코드 저장"""
        packages_path = self.base_path / self.config.get('packages_path', '04_패키지')
        # link type에 따라 하위 폴더명 매핑
        type_mapping = {
            'huggingface': '04-01-01_허깅페이스',
            'github': '04-01-02_깃허브'
        }
        subfolder = type_mapping.get(link['type'], link['type'])
        external_path = packages_path / "04-01_외부리소스" / subfolder
        external_path.mkdir(parents=True, exist_ok=True)
        
        file_name = link['url'].split('/')[-1].replace('.', '_') + '.py'
        code_file = external_path / file_name
        code_file.write_text(code, encoding='utf-8')
        
        self.logger.info(f"Saved external code: {code_file}")
    
    def _load_config(self, config_path: str) -> Dict:
        """설정 파일 로드"""
        import yaml
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

class FileWatcher(FileSystemEventHandler):
    """파일 시스템 변경 감지"""
    
    def __init__(self, task_runner: MLOpsTaskRunner):
        self.task_runner = task_runner
    
    def on_created(self, event):
        if event.src_path.endswith('.md'):
            self.task_runner.logger.info(f"New file detected: {event.src_path}")
            threading.Thread(target=self.task_runner.process_new_files).start()
    
    def on_modified(self, event):
        if event.src_path.endswith('.md'):
            self.task_runner.logger.info(f"File modified: {event.src_path}")
            threading.Thread(target=self.task_runner.process_new_files).start()

def main():
    """메인 실행 함수"""
    runner = MLOpsTaskRunner()
    
    # 파일 감시 시작
    event_handler = FileWatcher(runner)
    observer = Observer()
    
    kb_path = runner.config.get('knowledge_base_path', '01_지식베이스')
    watch_path = runner.base_path / kb_path
    observer.schedule(event_handler, str(watch_path), recursive=True)
    observer.start()
    
    runner.logger.info(f"Watching directory: {watch_path}")
    runner.logger.info("Task runner started. Press Ctrl+C to stop.")
    
    # 스케줄된 작업 실행
    try:
        runner.run_scheduled_tasks()
    except KeyboardInterrupt:
        runner.logger.info("Shutting down...")
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()

