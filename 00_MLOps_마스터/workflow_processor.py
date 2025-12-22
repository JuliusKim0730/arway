# workflow_processor.py
import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import frontmatter
import markdown
from jinja2 import Environment, FileSystemLoader

class MDProcessingPipeline:
    """MD 파일을 처리하고 코드를 생성하는 파이프라인"""
    
    def __init__(self, knowledge_base_path: str = "01_지식베이스"):
        # 상대 경로를 현재 스크립트 위치 기준으로 설정
        base_path = Path(__file__).parent.parent
        self.knowledge_base_path = base_path / knowledge_base_path
        self.generated_path = base_path / "03_생성된파일"
        self.packages_path = base_path / "04_패키지"
        self.metadata_path = base_path / "02_메타데이터"
        
        # 디렉토리 생성
        for path in [self.generated_path, self.packages_path, self.metadata_path]:
            path.mkdir(parents=True, exist_ok=True)
    
    def process_md_file(self, md_file_path: str) -> Dict:
        """MD 파일을 처리하고 메타데이터 추출"""
        with open(md_file_path, 'r', encoding='utf-8') as file:
            post = frontmatter.load(file)
            
        metadata = {
            'file_path': str(md_file_path),
            'file_hash': self._generate_hash(md_file_path),
            'title': post.get('title', Path(md_file_path).stem),
            'type': post.get('type', 'theory'),  # theory, concept, implementation
            'tags': post.get('tags', []),
            'dependencies': post.get('dependencies', []),
            'external_links': post.get('external_links', {}),
            'processed_at': datetime.now().isoformat(),
            'content': post.content
        }
        
        return metadata
    
    def generate_erd(self, metadata: Dict) -> str:
        """MD 메타데이터를 기반으로 ERD 생성"""
        erd_template = """
# Entity Relationship Diagram
## Project: {title}
## Generated: {timestamp}

### Entities
{entities}

### Relationships
{relationships}

### Data Flow
{data_flow}

### MLOps Components
{mlops_components}
        """
        
        # ERD 구성 요소 추출
        entities = self._extract_entities(metadata['content'])
        relationships = self._extract_relationships(metadata['content'])
        data_flow = self._extract_data_flow(metadata['content'])
        mlops_components = self._identify_mlops_components(metadata)
        
        erd = erd_template.format(
            title=metadata['title'],
            timestamp=datetime.now().isoformat(),
            entities=entities,
            relationships=relationships,
            data_flow=data_flow,
            mlops_components=mlops_components
        )
        
        # ERD 파일 저장
        erd_path = self.generated_path / "03-01_엔티티관계도" / f"{metadata['title']}_erd.md"
        erd_path.parent.mkdir(parents=True, exist_ok=True)
        erd_path.write_text(erd, encoding='utf-8')
        
        return str(erd_path)
    
    def generate_prd(self, metadata: Dict) -> str:
        """MD 메타데이터를 기반으로 PRD 생성"""
        prd_template = """
# Product Requirements Document
## Title: {title}
## Version: 1.0
## Date: {date}

### 1. Overview
{overview}

### 2. Objectives
{objectives}

### 3. Technical Requirements
{technical_requirements}

### 4. MLOps Integration
{mlops_integration}

### 5. Implementation Plan
{implementation_plan}

### 6. Success Metrics
{success_metrics}
        """
        
        prd = prd_template.format(
            title=metadata['title'],
            date=datetime.now().strftime("%Y-%m-%d"),
            overview=self._generate_overview(metadata),
            objectives=self._extract_objectives(metadata),
            technical_requirements=self._extract_requirements(metadata),
            mlops_integration=self._generate_mlops_plan(metadata),
            implementation_plan=self._generate_implementation_plan(metadata),
            success_metrics=self._define_success_metrics(metadata)
        )
        
        # PRD 파일 저장
        prd_path = self.generated_path / "03-02_제품요구사항" / f"{metadata['title']}_prd.md"
        prd_path.parent.mkdir(parents=True, exist_ok=True)
        prd_path.write_text(prd, encoding='utf-8')
        
        return str(prd_path)
    
    def generate_mlops_code(self, metadata: Dict, erd_path: str, prd_path: str) -> str:
        """ERD와 PRD를 기반으로 MLOps 코드 생성"""
        package_name = metadata['title'].lower().replace(' ', '_')
        package_path = self.packages_path / package_name
        package_path.mkdir(parents=True, exist_ok=True)
        
        # 기본 구조 생성
        self._create_package_structure(package_path, metadata)
        
        # MLFlow 통합 코드 생성
        mlflow_code = self._generate_mlflow_integration(metadata)
        (package_path / "src" / "mlflow_integration.py").write_text(mlflow_code, encoding='utf-8')
        
        # 데이터 파이프라인 코드 생성
        pipeline_code = self._generate_pipeline_code(metadata)
        (package_path / "src" / "pipeline.py").write_text(pipeline_code, encoding='utf-8')
        
        # 모델 코드 생성
        model_code = self._generate_model_code(metadata)
        (package_path / "src" / "model.py").write_text(model_code, encoding='utf-8')
        
        # 메타데이터 업데이트
        self._update_metadata(metadata, package_path)
        
        return str(package_path)
    
    def _generate_mlflow_integration(self, metadata: Dict) -> str:
        """MLFlow 통합 코드 생성"""
        return f'''
import mlflow
import mlflow.sklearn
import mlflow.pytorch
from pathlib import Path
from typing import Dict, Any, Optional
import json

class MLFlowManager:
    """MLFlow 실험 및 모델 관리 클래스"""
    
    def __init__(self, experiment_name: str = "{metadata['title']}"):
        self.experiment_name = experiment_name
        self.setup_experiment()
    
    def setup_experiment(self):
        """MLFlow 실험 설정"""
        mlflow.set_experiment(self.experiment_name)
        mlflow.autolog()
    
    def start_run(self, run_name: Optional[str] = None) -> mlflow.ActiveRun:
        """새로운 MLFlow 실행 시작"""
        return mlflow.start_run(run_name=run_name)
    
    def log_params(self, params: Dict[str, Any]):
        """파라미터 로깅"""
        for key, value in params.items():
            mlflow.log_param(key, value)
    
    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None):
        """메트릭 로깅"""
        for key, value in metrics.items():
            mlflow.log_metric(key, value, step=step)
    
    def log_model(self, model, artifact_path: str, **kwargs):
        """모델 로깅 및 등록"""
        model_info = mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path=artifact_path,
            registered_model_name=self.experiment_name,
            **kwargs
        )
        return model_info
    
    def load_model(self, model_id: str):
        """모델 로드"""
        model_uri = f"models://{{model_id}}"
        return mlflow.pyfunc.load_model(model_uri)
    
    def search_best_model(self, metric_name: str = "accuracy"):
        """최고 성능 모델 검색"""
        runs = mlflow.search_runs(experiment_ids=[mlflow.get_experiment_by_name(self.experiment_name).experiment_id])
        best_run = runs.loc[runs[f"metrics.{{metric_name}}"].idxmax()]
        return best_run

# 메타데이터 정보
METADATA = {{
    "title": "{metadata['title']}",
    "version": "1.0.0",
    "tags": {metadata.get('tags', [])},
    "dependencies": {metadata.get('dependencies', [])}
}}
'''
    
    def _generate_pipeline_code(self, metadata: Dict) -> str:
        """데이터 파이프라인 코드 생성"""
        return f'''
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataPipeline:
    """데이터 처리 파이프라인"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {{}}
        self.pipeline = None
        self._build_pipeline()
    
    def _build_pipeline(self):
        """파이프라인 구성"""
        self.pipeline = Pipeline([
            ('scaler', StandardScaler()),
            # 추가 전처리 단계
        ])
        logger.info("Data pipeline built successfully")
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """데이터 로드"""
        logger.info(f"Loading data from {{data_path}}")
        return pd.read_csv(data_path)
    
    def preprocess(self, data: pd.DataFrame) -> pd.DataFrame:
        """데이터 전처리"""
        logger.info("Preprocessing data")
        # 전처리 로직
        return data
    
    def split_data(self, X: np.ndarray, y: np.ndarray, 
                   test_size: float = 0.2) -> Tuple[np.ndarray, ...]:
        """데이터 분할"""
        return train_test_split(X, y, test_size=test_size, random_state=42)
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        """데이터 변환"""
        if self.pipeline is None:
            raise ValueError("Pipeline not initialized")
        return self.pipeline.fit_transform(X)

# 프로젝트 설정
PROJECT_CONFIG = {{
    "name": "{metadata['title']}",
    "pipeline_version": "1.0.0"
}}
'''
    
    def _generate_model_code(self, metadata: Dict) -> str:
        """모델 코드 생성"""
        return f'''
from typing import Any, Dict, Optional
import numpy as np
from sklearn.base import BaseEstimator
import joblib
import logging

logger = logging.getLogger(__name__)

class MLModel(BaseEstimator):
    """머신러닝 모델 래퍼"""
    
    def __init__(self, model_type: str = "default", **kwargs):
        self.model_type = model_type
        self.model = None
        self.params = kwargs
        self._initialize_model()
    
    def _initialize_model(self):
        """모델 초기화"""
        # 모델 타입에 따른 초기화
        logger.info(f"Initializing model: {{self.model_type}}")
        pass
    
    def fit(self, X: np.ndarray, y: np.ndarray):
        """모델 학습"""
        logger.info("Training model")
        # 학습 로직
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """예측"""
        if self.model is None:
            raise ValueError("Model not trained")
        return self.model.predict(X)
    
    def save(self, path: str):
        """모델 저장"""
        joblib.dump(self, path)
        logger.info(f"Model saved to {{path}}")
    
    @classmethod
    def load(cls, path: str):
        """모델 로드"""
        logger.info(f"Loading model from {{path}}")
        return joblib.load(path)

# 모델 설정
MODEL_CONFIG = {{
    "name": "{metadata['title']}_model",
    "version": "1.0.0"
}}
'''
    
    def _create_package_structure(self, package_path: Path, metadata: Dict):
        """패키지 구조 생성"""
        # 디렉토리 생성
        (package_path / "src").mkdir(exist_ok=True)
        (package_path / "tests").mkdir(exist_ok=True)
        (package_path / "configs").mkdir(exist_ok=True)
        (package_path / "docs").mkdir(exist_ok=True)
        
        # __init__.py 생성
        (package_path / "src" / "__init__.py").write_text("", encoding='utf-8')
        (package_path / "tests" / "__init__.py").write_text("", encoding='utf-8')
        
        # requirements.txt 생성
        requirements = """
mlflow>=2.0.0
scikit-learn>=1.0.0
pandas>=1.3.0
numpy>=1.21.0
pytest>=7.0.0
joblib>=1.0.0
pyyaml>=6.0
        """.strip()
        (package_path / "requirements.txt").write_text(requirements, encoding='utf-8')
        
        # setup.py 생성
        setup_py = f'''
from setuptools import setup, find_packages

setup(
    name="{package_path.name}",
    version="1.0.0",
    packages=find_packages(),
    install_requires=open("requirements.txt").readlines(),
    author="MLOps Team",
    description="{metadata['title']} - MLOps Component",
    python_requires=">=3.8",
)
        '''
        (package_path / "setup.py").write_text(setup_py, encoding='utf-8')
        
        # README.md 생성
        readme = f"""
# {metadata['title']}

## Overview
{metadata.get('description', 'MLOps Component generated from knowledge base')}

## Installation
```bash
pip install -r requirements.txt
```

## Usage
```python
from src.mlflow_integration import MLFlowManager
from src.pipeline import DataPipeline
from src.model import MLModel

# Initialize components
mlflow_manager = MLFlowManager()
pipeline = DataPipeline()
model = MLModel()
```

## Tags
{', '.join(metadata.get('tags', []))}

## Generated from
- Source: {metadata['file_path']}
- Date: {metadata['processed_at']}
        """
        (package_path / "README.md").write_text(readme, encoding='utf-8')
    
    def _update_metadata(self, metadata: Dict, package_path: Path):
        """메타데이터 업데이트"""
        metadata_file = self.metadata_path / "local-components.json"
        
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                components = json.load(f)
        else:
            components = []
        
        component_metadata = {
            'id': hashlib.md5(metadata['title'].encode()).hexdigest(),
            'title': metadata['title'],
            'package_path': str(package_path),
            'source_file': metadata['file_path'],
            'tags': metadata.get('tags', []),
            'dependencies': metadata.get('dependencies', []),
            'created_at': metadata['processed_at'],
            'type': 'local_component'
        }
        
        components.append(component_metadata)
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(components, f, indent=2, ensure_ascii=False)
    
    def _generate_hash(self, file_path: str) -> str:
        """파일 해시 생성"""
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    # 헬퍼 메서드들
    def _extract_entities(self, content: str) -> str:
        """컨텐츠에서 엔티티 추출"""
        # 실제 구현 필요
        return "- Data Entity\n- Model Entity\n- Pipeline Entity"
    
    def _extract_relationships(self, content: str) -> str:
        """관계 추출"""
        return "- Data -> Pipeline\n- Pipeline -> Model\n- Model -> MLFlow"
    
    def _extract_data_flow(self, content: str) -> str:
        """데이터 플로우 추출"""
        return "1. Input Data\n2. Preprocessing\n3. Training\n4. Evaluation\n5. Deployment"
    
    def _identify_mlops_components(self, metadata: Dict) -> str:
        """MLOps 컴포넌트 식별"""
        return "- MLFlow Tracking\n- Model Registry\n- Data Versioning\n- CI/CD Pipeline"
    
    def _generate_overview(self, metadata: Dict) -> str:
        """개요 생성"""
        return f"Component for {metadata['title']}"
    
    def _extract_objectives(self, metadata: Dict) -> str:
        """목표 추출"""
        return "- Automate ML workflow\n- Enable reproducibility\n- Track experiments"
    
    def _extract_requirements(self, metadata: Dict) -> str:
        """요구사항 추출"""
        return "- Python 3.8+\n- MLFlow 2.0+\n- Docker support"
    
    def _generate_mlops_plan(self, metadata: Dict) -> str:
        """MLOps 계획 생성"""
        return "Integration with MLFlow for experiment tracking and model registry"
    
    def _generate_implementation_plan(self, metadata: Dict) -> str:
        """구현 계획 생성"""
        return "1. Setup environment\n2. Implement pipeline\n3. Train model\n4. Deploy"
    
    def _define_success_metrics(self, metadata: Dict) -> str:
        """성공 지표 정의"""
        return "- Model accuracy > 90%\n- Pipeline runtime < 1 hour\n- 100% test coverage"

