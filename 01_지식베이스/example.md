---
title: "예제 ML 프로젝트"
type: "implementation"
tags: ["classification", "scikit-learn", "mlflow"]
dependencies: ["pandas", "numpy", "scikit-learn"]
external_links:
  huggingface: "https://huggingface.co/bert-base-uncased"
  github: "https://github.com/scikit-learn/scikit-learn"
---

# 예제 ML 프로젝트

이것은 MLOps 환경의 예제 프로젝트입니다.

## 개요

이 프로젝트는 간단한 분류 모델을 학습하고 MLFlow를 통해 추적하는 예제입니다.

## 데이터

- 입력: CSV 형식의 데이터
- 타겟: 이진 분류 문제

## 모델

- 알고리즘: Random Forest
- 하이퍼파라미터 튜닝: GridSearchCV

## MLOps 통합

- MLFlow를 통한 실험 추적
- 모델 레지스트리 등록
- 자동화된 파이프라인

