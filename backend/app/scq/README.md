# SCQ (Soft Convex Quantization) 엔진

SCQ 논문 기반 미분 가능한 볼록 최적화 레이어 구현

## 개요

SCQ는 Vector Quantization의 코드북 collapse 문제를 해결하기 위해 볼록 최적화를 사용한 미분 가능한 양자화 레이어입니다.

## 구조

```
app/scq/
├── __init__.py          # 모듈 초기화
├── scq_layer.py         # SCQ 레이어 구현
├── scq_autoencoder.py   # SCQ Autoencoder 구현
└── utils.py            # 유틸리티 함수
```

## 주요 컴포넌트

### SCQLayer

미분 가능한 볼록 최적화 레이어

```python
from app.scq import SCQLayer

layer = SCQLayer(
    codebook_dim=128,
    num_codes=256,
    lam=1e-3
)

z_q, alpha, stats = layer(z)
```

### SCQAutoencoder

Encoder + SCQ + Decoder 구조

```python
from app.scq import SCQAutoencoder

model = SCQAutoencoder(
    input_channels=3,
    latent_dim=128,
    num_codes=256,
    scq_lambda=1e-3
)

x_recon, z, z_q, stats = model(x)
```

## 사용 예시

### 기본 사용

```python
import torch
from app.scq import SCQAutoencoder

# 모델 생성
model = SCQAutoencoder(
    input_channels=3,
    latent_dim=128,
    num_codes=256
)

# Forward pass
x = torch.randn(1, 3, 64, 64)
x_recon, z, z_q, stats = model(x)

print(f"재구성 손실: {torch.nn.functional.mse_loss(x_recon, x)}")
print(f"엔트로피: {stats['entropy']}")
```

### 학습

```python
from app.scq.scq_autoencoder import compute_loss
import torch.optim as optim

optimizer = optim.Adam(model.parameters(), lr=1e-4)

# Forward
x_recon, z, z_q, stats = model(x)

# 손실 계산
loss, loss_dict = compute_loss(x_recon, x, z, z_q, stats)

# 역전파
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

## 실험 스크립트

### AR 네비게이션

```bash
python experiments/nav_ar/train_scq_nav.py
```

### AR 음식 인식

```bash
python experiments/food_ar/train_scq_food.py
```

## 의존성

- torch >= 2.0.0
- cvxpy >= 1.3.0
- cvxpylayers >= 0.1.6
- numpy >= 1.24.0
- scikit-learn >= 1.3.0

## 참고 자료

- SCQ 논문: Soft Convex Quantization (Gautam et al., L4DC 2024)
- cvxpylayers: https://github.com/cvxpy/cvxpylayers

