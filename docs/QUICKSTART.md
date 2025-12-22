# 빠른 시작 가이드

## 1단계: 환경 설정

```bash
# 가상 환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 의존성 설치
pip install -r requirements.txt
```

## 2단계: MLFlow 서버 실행 (선택사항)

별도 터미널에서:

```bash
mlflow server --host 0.0.0.0 --port 5000
```

또는 Docker 사용:

```bash
docker-compose up mlflow
```

## 3단계: 예제 실행

### 방법 1: Task Runner 실행 (자동화)

```bash
python run_mlops.py
```

이 명령은:
- `01_지식베이스/` 디렉토리를 감시
- 새 MD 파일을 자동 처리
- 주기적으로 작업 실행

### 방법 2: 수동 처리

```python
from pathlib import Path
import sys

# 경로 추가
sys.path.insert(0, str(Path("00_MLOps_마스터")))

from workflow_processor import MDProcessingPipeline

# 파이프라인 초기화
pipeline = MDProcessingPipeline()

# 예제 파일 처리
metadata = pipeline.process_md_file("01_지식베이스/example.md")
erd_path = pipeline.generate_erd(metadata)
prd_path = pipeline.generate_prd(metadata)
package_path = pipeline.generate_mlops_code(metadata, erd_path, prd_path)

print(f"생성된 패키지: {package_path}")
```

## 4단계: 결과 확인

생성된 파일 확인:

- **ERD**: `03_생성된파일/03-01_엔티티관계도/`
- **PRD**: `03_생성된파일/03-02_제품요구사항/`
- **패키지**: `04_패키지/{프로젝트명}/`
- **메타데이터**: `02_메타데이터/local-components.json`

## 5단계: 생성된 패키지 사용

```python
from 04_패키지.example_ml_project.src.mlflow_integration import MLFlowManager
from 04_패키지.example_ml_project.src.pipeline import DataPipeline
from 04_패키지.example_ml_project.src.model import MLModel

# 컴포넌트 초기화
mlflow_manager = MLFlowManager()
pipeline = DataPipeline()
model = MLModel()

# 사용 예제
# ...
```

## 문제 해결

### MLFlow 연결 오류
- MLFlow 서버가 실행 중인지 확인
- `config.yaml`의 `mlflow.tracking_uri` 확인

### 모듈 임포트 오류
- `00_MLOps_마스터` 경로가 `sys.path`에 추가되었는지 확인
- 가상 환경이 활성화되었는지 확인

### 파일 처리 오류
- MD 파일의 frontmatter 형식 확인
- `01_지식베이스/` 경로 확인

## 다음 단계

1. `01_지식베이스/`에 자신의 MD 파일 추가
2. 외부 링크 추가 (`external_link_manager` 사용)
3. 생성된 코드 커스터마이징
4. MLFlow 대시보드에서 실험 확인

