# external_link_manager.py
import json
import requests
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime
import subprocess

class ExternalLinkManager:
    """외부 링크(HuggingFace, GitHub) 관리 및 코드 변환"""
    
    def __init__(self, metadata_path: str = None):
        if metadata_path is None:
            # 기본 경로 설정
            base_path = Path(__file__).parent.parent
            metadata_path = base_path / "02_메타데이터"
        self.metadata_path = Path(metadata_path)
        self.external_links_file = self.metadata_path / "external-links.json"
        self.load_links()
    
    def load_links(self):
        """저장된 외부 링크 로드"""
        if self.external_links_file.exists():
            with open(self.external_links_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # external-links.json이 객체인 경우 links 키 확인
                if isinstance(data, dict) and 'links' in data:
                    self.links = data['links']
                elif isinstance(data, list):
                    self.links = data
                else:
                    self.links = []
        else:
            self.links = []
    
    def add_link(self, link_metadata: Dict):
        """외부 링크 추가"""
        link_entry = {
            'url': link_metadata['url'],
            'type': self._detect_link_type(link_metadata['url']),
            'title': link_metadata.get('title', ''),
            'description': link_metadata.get('description', ''),
            'tags': link_metadata.get('tags', []),
            'added_at': datetime.now().isoformat()
        }
        
        self.links.append(link_entry)
        self.save_links()
    
    def _detect_link_type(self, url: str) -> str:
        """링크 타입 감지"""
        if 'huggingface.co' in url:
            return 'huggingface'
        elif 'github.com' in url:
            return 'github'
        else:
            return 'other'
    
    def convert_to_code(self, link_entry: Dict) -> Optional[str]:
        """외부 링크를 실제 코드로 변환"""
        if link_entry['type'] == 'huggingface':
            return self._convert_huggingface(link_entry['url'])
        elif link_entry['type'] == 'github':
            return self._convert_github(link_entry['url'])
        return None
    
    def _convert_huggingface(self, url: str) -> str:
        """HuggingFace 모델/데이터셋을 코드로 변환"""
        # URL에서 모델/데이터셋 ID 추출
        parts = url.split('/')
        if 'models' in parts:
            model_id = '/'.join(parts[parts.index('models')+1:])
            return self._generate_hf_model_code(model_id)
        elif 'datasets' in parts:
            dataset_id = '/'.join(parts[parts.index('datasets')+1:])
            return self._generate_hf_dataset_code(dataset_id)
        return ""
    
    def _generate_hf_model_code(self, model_id: str) -> str:
        """HuggingFace 모델 사용 코드 생성"""
        return f'''
from transformers import AutoModel, AutoTokenizer
import torch

class HuggingFaceModel:
    """HuggingFace 모델 래퍼"""
    
    def __init__(self, model_id: str = "{model_id}"):
        self.model_id = model_id
        self.model = None
        self.tokenizer = None
        self.load_model()
    
    def load_model(self):
        """모델 및 토크나이저 로드"""
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        self.model = AutoModel.from_pretrained(self.model_id)
        
    def predict(self, text: str):
        """예측 수행"""
        inputs = self.tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs
    
    def save_local(self, path: str):
        """모델을 로컬에 저장"""
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)

# 사용 예제
model = HuggingFaceModel("{model_id}")
result = model.predict("Sample text")
'''
    
    def _generate_hf_dataset_code(self, dataset_id: str) -> str:
        """HuggingFace 데이터셋 사용 코드 생성"""
        return f'''
from datasets import load_dataset
import pandas as pd

class HuggingFaceDataset:
    """HuggingFace 데이터셋 래퍼"""
    
    def __init__(self, dataset_id: str = "{dataset_id}"):
        self.dataset_id = dataset_id
        self.dataset = None
        self.load_dataset()
    
    def load_dataset(self):
        """데이터셋 로드"""
        self.dataset = load_dataset(self.dataset_id)
    
    def to_pandas(self, split: str = "train") -> pd.DataFrame:
        """Pandas DataFrame으로 변환"""
        return self.dataset[split].to_pandas()
    
    def get_sample(self, n: int = 5):
        """샘플 데이터 반환"""
        return self.dataset["train"].select(range(n))

# 사용 예제
dataset = HuggingFaceDataset("{dataset_id}")
df = dataset.to_pandas()
'''
    
    def _convert_github(self, url: str) -> str:
        """GitHub 리포지토리를 로컬로 클론하고 사용 가능한 코드로 변환"""
        # GitHub URL에서 리포지토리 정보 추출
        parts = url.replace('https://github.com/', '').split('/')
        owner, repo = parts[0], parts[1].replace('.git', '')
        
        return f'''
import subprocess
import sys
from pathlib import Path

class GitHubRepository:
    """GitHub 리포지토리 관리자"""
    
    def __init__(self, repo_url: str = "{url}"):
        self.repo_url = repo_url
        self.repo_name = "{repo}"
        self.local_path = Path("external_repos") / self.repo_name
    
    def clone(self):
        """리포지토리 클론"""
        if not self.local_path.exists():
            subprocess.run([
                "git", "clone", self.repo_url, str(self.local_path)
            ])
    
    def install_requirements(self):
        """의존성 설치"""
        req_file = self.local_path / "requirements.txt"
        if req_file.exists():
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(req_file)
            ])
    
    def import_module(self, module_name: str):
        """모듈 동적 임포트"""
        sys.path.insert(0, str(self.local_path))
        return __import__(module_name)

# 사용 예제
repo = GitHubRepository("{url}")
repo.clone()
repo.install_requirements()
'''
    
    def save_links(self):
        """링크 메타데이터 저장"""
        # external-links.json 형식에 맞게 저장
        data = {
            "links": self.links,
            "last_updated": datetime.now().isoformat()
        }
        with open(self.external_links_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def search_links(self, query: str) -> List[Dict]:
        """링크 검색"""
        results = []
        for link in self.links:
            if query.lower() in str(link).lower():
                results.append(link)
        return results

