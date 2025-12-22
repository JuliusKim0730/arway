"""
MLOps 환경 설정 스크립트
"""
from setuptools import setup, find_packages
from pathlib import Path

# README 읽기
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

setup(
    name="mlops-environment",
    version="1.0.0",
    description="MLOps Master 기반 자동화 환경",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="MLOps Team",
    python_requires=">=3.8",
    packages=find_packages(exclude=["tests", "tests.*"]),
    install_requires=[
        "mlflow>=2.0.0",
        "scikit-learn>=1.0.0",
        "pandas>=1.3.0",
        "numpy>=1.21.0",
        "joblib>=1.0.0",
        "python-frontmatter>=1.0.0",
        "markdown>=3.4.0",
        "jinja2>=3.1.0",
        "pyyaml>=6.0",
        "watchdog>=2.1.0",
        "schedule>=1.2.0",
        "requests>=2.28.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=0.950",
        ],
        "huggingface": [
            "transformers>=4.21.0",
            "datasets>=2.0.0",
            "torch>=1.12.0",
        ],
    },
    # entry_points는 패키지 이름에 공백/한글이 포함되어 사용 불가
    # 대신 python run_mlops.py를 직접 사용하세요
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)

