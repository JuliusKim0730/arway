#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MLOps 환경 초기화 스크립트
필요한 디렉토리 구조를 생성합니다.
"""
from pathlib import Path
import json


def init_mlops_environment():
    """MLOps 환경 초기화"""
    base_path = Path(__file__).parent
    
    # 디렉토리 구조 정의 (워크플로우 순서대로)
    directories = [
        "00_MLOps_마스터",  # 처리 엔진
        "01_지식베이스",  # 입력
        "02_메타데이터",  # 중간 저장
        "03_생성된파일",  # 생성된 문서
        "03_생성된파일/03-01_엔티티관계도",
        "03_생성된파일/03-02_제품요구사항",
        "04_패키지",  # 최종 출력
        "04_패키지/04-01_외부리소스",
        "04_패키지/04-01_외부리소스/04-01-01_허깅페이스",
        "04_패키지/04-01_외부리소스/04-01-02_깃허브",
        "05_ml실행기록",  # MLFlow 실행 기록
        "06_ml아티팩트",  # MLFlow 아티팩트
        "07_테스트",  # 테스트
    ]
    
    # 디렉토리 생성
    print("디렉토리 구조 생성 중...")
    for dir_path in directories:
        full_path = base_path / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"  [OK] {dir_path}")
    
    # 메타데이터 파일 초기화
    print("\n메타데이터 파일 초기화 중...")
    metadata_files = {
        "02_메타데이터/processed_files.json": {},
        "02_메타데이터/external-links.json": {
            "links": [],
            "last_updated": None
        },
        "02_메타데이터/local-components.json": []
    }
    
    for file_path, default_content in metadata_files.items():
        full_path = base_path / file_path
        if not full_path.exists():
            with open(full_path, 'w', encoding='utf-8') as f:
                json.dump(default_content, f, indent=2, ensure_ascii=False)
            print(f"  [OK] {file_path}")
    
    print("\n[SUCCESS] MLOps 환경 초기화 완료!")
    print("\n워크플로우 순서:")
    print("  00: MLOps 마스터 (처리 엔진)")
    print("  01: 지식베이스 (입력)")
    print("  02: 메타데이터 (중간 저장)")
    print("  03: 생성된파일 (ERD, PRD)")
    print("  04: 패키지 (최종 출력)")
    print("  05: ml실행기록 (MLFlow)")
    print("  06: ml아티팩트 (MLFlow)")
    print("  07: 테스트")
    print("\n다음 단계:")
    print("  1. pip install -r requirements.txt")
    print("  2. 01_지식베이스/ 디렉토리에 MD 파일 추가")
    print("  3. python run_mlops.py 실행")


if __name__ == "__main__":
    init_mlops_environment()

