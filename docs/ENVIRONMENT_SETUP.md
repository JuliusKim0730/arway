# MLOps 환경 설정 완료

## ✅ 생성된 구조

```
MLOps/
├── 00_MLOps_마스터/              # 00: 처리 엔진 (핵심 프로세서)
│   ├── workflow_processor.py
│   ├── task_runner.py
│   ├── external_link_manager.py
│   └── workflows/
│       └── config.yaml
├── 01_지식베이스/            # 01: 입력 단계 (MD 파일)
│   └── example.md             # 예제 파일
├── 02_메타데이터/                  # 02: 중간 저장 (메타데이터)
│   ├── processed_files.json
│   ├── external-links.json
│   └── local-components.json
├── 03_생성된파일/                 # 03: 생성된 문서 (ERD, PRD)
│   ├── 03-01_엔티티관계도/                   # ERD 파일
│   └── 03-02_제품요구사항/                   # PRD 파일
├── 04_패키지/                  # 04: 최종 출력 (생성된 패키지)
│   └── 04-01_외부리소스/             # 외부 리소스
│       ├── 04-01-01_허깅페이스/
│       └── 04-01-02_깃허브/
├── 05_ml실행기록/                    # 05: MLFlow 실행 기록
├── 06_ml아티팩트/               # 06: MLFlow 아티팩트
├── 07_테스트/                     # 07: 테스트 코드
├── requirements.txt           # Python 의존성
├── setup.py                   # 패키지 설정
├── run_mlops.py              # 실행 스크립트
├── init_environment.py        # 환경 초기화 스크립트
├── README.md                  # 메인 문서
├── QUICKSTART.md              # 빠른 시작 가이드
├── Dockerfile                 # Docker 이미지
└── docker-compose.yml         # Docker Compose 설정
```

## 🚀 사용 방법

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 초기화 (이미 완료됨)

```bash
python init_environment.py
```

### 3. MLFlow 서버 실행 (선택사항)

```bash
# 직접 실행
mlflow server --host 0.0.0.0 --port 5000

# 또는 Docker 사용
docker-compose up mlflow
```

### 4. Task Runner 실행

```bash
python run_mlops.py
```

## 📝 주요 기능

### 자동 코드 생성
- MD 파일에서 ERD, PRD 자동 생성
- MLOps 패키지 자동 생성
- MLFlow 통합 코드 포함

### 파일 감시
- `01_지식베이스/` 디렉토리 자동 감시
- 새 파일 또는 수정된 파일 자동 처리

### 외부 리소스 통합
- HuggingFace 모델/데이터셋 자동 통합
- GitHub 리포지토리 자동 클론 및 통합

### 스케줄링
- 주기적인 파일 처리 (기본: 1시간마다)
- 외부 링크 업데이트 (기본: 6시간마다)
- 오래된 아티팩트 정리 (기본: 30일)

## 🔧 설정

`00_MLOps_마스터/workflows/config.yaml` 파일에서 다음을 설정할 수 있습니다:

- **knowledge_base_path**: Knowledge Base 경로
- **mlflow**: MLFlow 서버 설정
- **processing**: 자동 생성 옵션
- **external_sources**: 외부 리소스 통합 설정
- **scheduling**: 스케줄링 옵션

## 📦 생성되는 패키지

각 MD 파일은 다음 구조의 패키지로 변환됩니다:

```
04_패키지/{project_name}/
├── src/
│   ├── mlflow_integration.py
│   ├── pipeline.py
│   └── model.py
├── tests/
├── configs/
├── docs/
├── requirements.txt
├── setup.py
└── README.md
```

## 🧪 테스트

```bash
pytest tests/
```

## 📚 추가 문서

- **README.md**: 전체 프로젝트 설명
- **QUICKSTART.md**: 빠른 시작 가이드
- **00_MLOps_마스터/workflows/config.yaml**: 설정 파일

## 🔍 문제 해결

### MLFlow 연결 오류
- MLFlow 서버가 실행 중인지 확인
- `config.yaml`의 `mlflow.tracking_uri` 확인

### 모듈 임포트 오류
- `00_MLOps_마스터` 경로가 `sys.path`에 추가되었는지 확인
- 가상 환경이 활성화되었는지 확인

### 파일 처리 오류
- MD 파일의 frontmatter 형식 확인
- `01_지식베이스/` 경로 확인

## 📞 다음 단계

1. `01_지식베이스/`에 자신의 MD 파일 추가
2. 외부 링크 추가 (`external_link_manager` 사용)
3. 생성된 코드 커스터마이징
4. MLFlow 대시보드에서 실험 확인

