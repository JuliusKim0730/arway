"""
SCQ 유틸리티 함수
"""
import torch
import numpy as np
from typing import Tuple, Optional
from sklearn.cluster import KMeans


def initialize_codebook_kmeans(
    z_samples: torch.Tensor,
    num_codes: int,
    random_state: int = 42
) -> torch.Tensor:
    """
    K-means로 코드북 초기화
    
    Args:
        z_samples: 샘플 잠재 벡터 (N, d)
        num_codes: 코드북 크기
        random_state: 랜덤 시드
    
    Returns:
        codebook: 초기화된 코드북 (K, d)
    """
    z_np = z_samples.detach().cpu().numpy()
    
    kmeans = KMeans(n_clusters=num_codes, random_state=random_state, n_init=10)
    kmeans.fit(z_np)
    
    codebook = torch.from_numpy(kmeans.cluster_centers_).float()
    
    return codebook


def compute_psnr(img1: torch.Tensor, img2: torch.Tensor) -> float:
    """
    PSNR (Peak Signal-to-Noise Ratio) 계산
    
    Args:
        img1: 첫 번째 이미지 (B, C, H, W)
        img2: 두 번째 이미지 (B, C, H, W)
    
    Returns:
        psnr: 평균 PSNR 값
    """
    mse = torch.mean((img1 - img2) ** 2)
    if mse == 0:
        return float('inf')
    
    max_val = 1.0  # 이미지가 [-1, 1] 범위라고 가정
    psnr = 20 * torch.log10(max_val / torch.sqrt(mse))
    
    return psnr.item()


def compute_ssim(
    img1: torch.Tensor,
    img2: torch.Tensor,
    window_size: int = 11
) -> float:
    """
    SSIM (Structural Similarity Index) 계산 (간단한 버전)
    
    Args:
        img1: 첫 번째 이미지 (B, C, H, W)
        img2: 두 번째 이미지 (B, C, H, W)
        window_size: 윈도우 크기
    
    Returns:
        ssim: 평균 SSIM 값
    """
    # 간단한 구현: 실제로는 더 정교한 SSIM 계산 필요
    mu1 = torch.mean(img1)
    mu2 = torch.mean(img2)
    
    sigma1_sq = torch.var(img1)
    sigma2_sq = torch.var(img2)
    sigma12 = torch.mean((img1 - mu1) * (img2 - mu2))
    
    C1 = 0.01 ** 2
    C2 = 0.03 ** 2
    
    ssim = ((2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)) / \
           ((mu1 ** 2 + mu2 ** 2 + C1) * (sigma1_sq + sigma2_sq + C2))
    
    return ssim.item()


def estimate_bitrate(
    alpha: torch.Tensor,
    num_codes: int
) -> float:
    """
    양자화 비트레이트 추정
    
    Args:
        alpha: 볼록 결합 계수 (B, K) 또는 (B, H, W, K)
        num_codes: 코드북 크기
    
    Returns:
        bitrate: 비트/픽셀 또는 비트/샘플
    """
    # 활성 코드 수 기반 비트레이트 추정
    active_codes = (alpha > 1e-3).sum(dim=-1).float()
    avg_active = active_codes.mean().item()
    
    # 각 활성 코드를 인덱스로 표현하는데 필요한 비트 수
    bits_per_code = np.log2(num_codes)
    bitrate = avg_active * bits_per_code
    
    return bitrate

