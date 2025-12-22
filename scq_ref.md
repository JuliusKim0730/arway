1. SCQ 엔진에 활용할 무료 라이브러리 & 오픈소스 정리
1-1. SCQ 알고리즘 레퍼런스(필수 읽을거리)

Soft Convex Quantization 원 논문

Soft Convex Quantization: Revisiting Vector Quantization with Convex Optimization (Gautam et al., L4DC 2024)
arXiv
+1

내용:

VQ의 코드북 collapse / 비미분성 문제를 해결하기 위해

입력 벡터를 코드북 벡터들의 “볼록 결합”으로 근사하는 최적화 문제로 정의

이 최적화 문제를 미분 가능한 convex optimization layer(DCO) 로 구현

→ 이 논문이 “수학적 정의서 + 알고리즘 스펙”이고, 실제 코드는 우리가 아래 DCO 라이브러리로 구현하는 구조.

1-2. 미분 가능한 Convex Optimization 레이어 (SCQ의 엔진 코어)

cvxpylayers 
GitHub
+2
GitHub
+2

깃허브: cvxpy/cvxpylayers

기능:

CVXPY로 정의한 “볼록 최적화 문제”를
PyTorch/JAX/MLX에서 한 번에 쓰는 미분 가능한 레이어로 export

forward: 최적화 문제 풀어서 해(α* 구하기)
backward: 해의 민감도로부터 gradient 자동 계산

설치 예:

pip install cvxpy cvxpylayers


SCQ와의 연결:

SCQ 논문이 말하는 “DCO layer”를 거의 그대로 구현할 수 있는 툴.

qpth (옵션, QP에 특화) 
GitHub

깃허브: locuslab/qpth

기능:

PyTorch용 빠른, batched, 미분가능 QP 레이어

만약 SCQ를

min
⁡
𝛼
1
2
∥
𝑧
−
𝐶
𝑇
𝛼
∥
2
𝑠
.
𝑡
.
 
𝛼
≥
0
,
 
1
⊤
𝛼
=
1
α
min
	​

2
1
	​

∥z−C
T
α∥
2
s.t. α≥0, 1
⊤
α=1

같은 QP 형태로 쓴다면 qpth로도 가능.

1-3. VQ / Soft-VQ 계열 레포 (코드북/트레이닝 구조 레퍼런스)

SCQ 레이어 자체는 우리가 짜야 하지만, 코드북 관리, EMA 업데이트, 오토인코더 구조는 기존 VQ-VAE 구현을 그대로 참고하면 돼.

lucidrains/vector-quantize-pytorch 
deps.dev
+1

pip: pip install vector-quantize-pytorch

다양한 VQ 변형들(VQ, RVQ 등)을 PyTorch로 구현한 레포

코드북 구조, EMA 업데이트, commitment loss 등 구현 참고용으로 최적.

zalandoresearch/pytorch-vq-vae (VQ-VAE 기본구현) 
GitHub
+1

PyTorch VQ-VAE 레퍼런스.

간단한 오토인코더 + VQ 구조와 트레이닝 루프 참고용.

MishaLaskin/vqvae (또 다른 VQ-VAE 구현) 
GitHub

SVQ / Soft-VQ 계열 (Soft Quantization 참고용)

Differentiable Soft Quantization (DSQ): PyTorch 구현 포크 존재
GitHub
+1

SVQ-Forecasting (Differentiable Sparse Soft-Vector Quantization): soft VQ의 구현 예시로 참고 가능
GitHub
+1

이 레포들은 “SCQ와 같은 소프트/확률적 코드북 기반 레이어를 어떻게 네트워크에 붙이고 학습시키는지” 구조를 가져오기 좋다.

1-4. (옵션) 허깅페이스 쪽 토큰화/코드북 참고

Hugging Face의 VQ-VAE / VQGAN 관련 자료 및 모델들
유튜브
+3
GitHub
+3
GitHub
+3

merve/vq-vae 등: discrete latent, 코드북/인코더 구조 참고

diffusers의 VQModel 문서: 실사용 VQ 코드 구조, forward 패턴 참고

2. SCQ 엔진 구현 워크플로우 (Cursor 기준)

컨셉:
**“기존 VQ-VAE 구조 + SCQ DCO Layer(cvxpylayers/QP)를 붙인 커스텀 코드북 레이어”**를 만들고,
이걸 **AR 네비/AR 음식 모델의 “압축/토큰화 모듈”**로 끼워 넣는 구조.

2-1. 환경/라이브러리 세팅

필수:

# 기본 ML 스택
pip install torch torchvision torchaudio

# Convex optimization layers
pip install cvxpy cvxpylayers   # 또는 qpth

# (옵션) VQ 참고용
pip install vector-quantize-pytorch


Cursor에서는:

하나의 repo 안에 /scq/ 모듈 만들어서

scq_layer.py

scq_autoencoder.py

experiments/nav_ar/, experiments/food_ar/ 이런 식으로 구성.

2-2. SCQ 레이어 수식 정리 (실제 구현 관점)

입력: encoder 출력 벡터 z ∈ R^d
코드북: C ∈ R^{K×d} (K개의 코드북 벡터)

SCQ 최적화 문제(전형적인 형태):
arXiv
+1

min
⁡
𝛼
∈
𝑅
𝐾
∥
𝑧
−
𝐶
⊤
𝛼
∥
2
2
+
𝜆
∥
𝛼
∥
2
2
α∈R
K
min
	​

∥z−C
⊤
α∥
2
2
	​

+λ∥α∥
2
2
	​


s.t.

𝛼
≥
0
,
1
⊤
𝛼
=
1
α≥0,1
⊤
α=1

해석:

C^T α가 코드북 벡터들의 볼록 결합(convex combination)

제약조건이 simplex(확률분포)라서 soft 선택

λ로 sparsity/안정성 조절 가능

cvxpylayers 코드 스케치(마인드 맵 정도로):

import cvxpy as cp
from cvxpylayers.torch import CvxpyLayer

K = ...  # codebook size

alpha = cp.Variable(K)
z_param = cp.Parameter(d)
C_param = cp.Parameter((d, K))  # transpose 형태로 둘 수도 있음

objective = cp.Minimize(cp.sum_squares(z_param - C_param @ alpha) + lam * cp.sum_squares(alpha))
constraints = [alpha >= 0, cp.sum(alpha) == 1]

problem = cp.Problem(objective, constraints)
layer = CvxpyLayer(problem, parameters=[z_param, C_param], variables=[alpha])


PyTorch forward에서:

alpha_star, = layer(z_batch, C)     # batched로 확장
z_q = torch.matmul(alpha_star, C.T) # quantized latent


→ 이렇게 만든 SCQ 레이어를 기존 VQ 레이어 자리에 꽂기.

2-3. 전체 구현 워크플로우 (엔진 관점)

Step 0. 베이스라인 VQ-VAE 돌려보기

zalandoresearch/pytorch-vq-vae나 MishaLaskin/vqvae 구조를 참고해서

이미지 인코더/디코더 + VQ 코드북 모델을 하나 만듦.
GitHub
+1

간단한 데이터셋으로 재구성 실험:

AR 네비: 작은 해상도의 도로/표지판 이미지 or 임의의 streetview 비슷한 데이터

AR 음식: 음식 사진 or 메뉴판 crop

이 단계 목적:

엔드투엔드 파이프라인 구조 파악 (입력 이미지 → latent → VQ → decoder)

baseline 재구성 성능, 코드북 사용량 체크.

Step 1. SCQ 레이어 모듈화

위에서 말한 대로 cvxpylayers(or qpth)를 써서 SCQLayer(nn.Module) 구현.

API는 기존 VQ 레이어와 최대한 비슷하게 설계:

class SCQLayer(nn.Module):
    def __init__(self, codebook_dim, num_codes, lam=1e-3):
        ...
    def forward(self, z):
        # z: (B, D) or (B, H, W, D)
        # return z_q, alpha, some regularization stats


코드북 업데이트 전략:

간단하게는 C도 일반 nn.Parameter로 두고 SGD/Adam으로 업데이트

혹은 VQ처럼 EMA-style 업데이트 구조를 참고 (vector-quantize-pytorch 코드 참고).
deps.dev
+1

Step 2. SCQ Autoencoder 통합

인코더/디코더 네트워크는 그대로 쓰고,

latent에서:

기존: z → VQ(...) → z_q

변경: z → SCQLayer(...) → z_q

loss:

재구성 loss (MSE, perceptual, etc.)

코드북 관련 regularization (예: entropy, α sparsity 등)

학습:

작은 해상도 + 소량 데이터로 먼저 돌려서

수렴성, 속도, 메모리 체크

배치 단위 convex solver가 bottleneck 되는지 확인

Step 3. AR 네비 / AR 음식용 소형 백본에 이식

여기서부터는 “서비스에 써먹는 버전”:

AR 네비용

입력: 전방 카메라 프레임(또는 downsample된 feature map)

백본: MobileNet / EfficientNet-lite / Tiny CNN

SCQ는:

도로나 차선/표지판 인식용 latent를

서버 전송 or on-device 캐싱용 discrete 코드로 변환하는 bottleneck

검증:

baseline (no SCQ) vs SCQ model의

Latent bitrate / 메모리 / FPS / 인식 정확도 비교

AR 음식용

입력: 음식 사진 / 메뉴 사진

백본: 비슷하게 CNN or ViT-tiny

SCQ:

음식 클래스 / 속성(latent)을 discrete token으로 만들어

on-device 추천 / 서버 측 맛-그래프 검색 등에 활용

→ 여기서 중요한 건 **“SCQ가 없었을 때 대비 통신량/메모리 절감 vs 정확도 손실”**을 보는 것.

2-4. 실제 개발 태스크 체크리스트 (Cursor에서 할 일)

A. 공통 엔진 레벨

 scq_layer.py

cvxpylayers 기반 SCQLayer 구현

batch 지원, GPU 지원 확인

 scq_autoencoder.py

Encoder / SCQ / Decoder 구조

학습/평가 스크립트 (train.py, eval.py)

 실험 스크립트

experiments/nav_ar/train_scq_nav.py

experiments/food_ar/train_scq_food.py

B. 데이터/전처리

 간이 도로/표지판 데이터셋 준비 (직접 촬영 + 공개 데이터 일부)

 음식/메뉴 이미지 데이터셋 준비

 공통 transform (resize, normalize)

C. 성능 측정 코드

 재구성 PSNR/SSIM

 코드북 사용률(활성 코드 수, entropy)

 latent 비트/픽셀 당 비트수 추정

 on-device 추정을 위한 FLOPs/latency 추정 스크립트

3. 요약 – 지금 현실적으로 할 수 있는 것

SCQ 공식 라이브러리는 아직 안 보임 →
➜ SCQ 논문 수식 + cvxpylayers / qpth로 직접 DCO 레이어를 구현해야 함.
arXiv
+2
GitHub
+2

코드북/토큰화 쪽은

vector-quantize-pytorch, pytorch-vq-vae 같은 검증된 VQ 레포를 레퍼런스로 가져와서,

**“VQ 레이어만 SCQ 레이어로 교체”**하는 방향이 가장 실용적.

AR 네비 / AR 음식 서비스에선,

처음에는 “작은 이미지 AE + SCQ”로 기술 데모부터 만들고

그 다음에 모바일 친화적인 백본+런타임(ONNX/TFLite/모바일 PyTorch) 쪽으로 확장하면 돼.