#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MLOps 환경 실행 스크립트
"""
import sys
from pathlib import Path

# MLOps 마스터 경로 추가
mlops_master_path = Path(__file__).parent / "00_MLOps_마스터"
sys.path.insert(0, str(mlops_master_path))

from task_runner import main

if __name__ == "__main__":
    main()

