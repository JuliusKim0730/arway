"""
SCQ 모듈 기본 테스트 스크립트
"""
import sys
from pathlib import Path

# backend 디렉토리를 경로에 추가
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

import torch
from app.scq import SCQLayer, SCQAutoencoder


def test_scq_layer():
    """SCQ 레이어 기본 테스트"""
    print("=== SCQ Layer 테스트 ===")
    
    # 레이어 생성
    layer = SCQLayer(
        codebook_dim=128,
        num_codes=256,
        lam=1e-3
    )
    
    # 테스트 입력
    z = torch.randn(2, 128)  # (B, d)
    
    print(f"입력 shape: {z.shape}")
    
    # Forward pass
    z_q, alpha, stats = layer(z)
    
    print(f"양자화 출력 shape: {z_q.shape}")
    print(f"볼록 결합 계수 shape: {alpha.shape}")
    print(f"엔트로피: {stats['entropy']:.4f}")
    print(f"Sparsity: {stats['sparsity']:.4f}")
    print(f"활성 코드 수: {stats['num_active_codes']}")
    print("[OK] SCQ Layer 테스트 통과\n")


def test_scq_autoencoder():
    """SCQ Autoencoder 기본 테스트"""
    print("=== SCQ Autoencoder 테스트 ===")
    
    # 모델 생성
    model = SCQAutoencoder(
        input_channels=3,
        latent_dim=128,
        num_codes=256,
        scq_lambda=1e-3
    )
    
    # 테스트 입력
    x = torch.randn(1, 3, 64, 64)  # (B, C, H, W)
    
    print(f"입력 이미지 shape: {x.shape}")
    
    # Forward pass
    x_recon, z, z_q, stats = model(x)
    
    print(f"재구성 이미지 shape: {x_recon.shape}")
    print(f"인코더 출력 shape: {z.shape}")
    print(f"양자화 벡터 shape: {z_q.shape}")
    print(f"엔트로피: {stats['entropy']:.4f}")
    
    # 재구성 손실 계산
    recon_loss = torch.nn.functional.mse_loss(x_recon, x)
    print(f"재구성 손실 (MSE): {recon_loss.item():.6f}")
    print("[OK] SCQ Autoencoder 테스트 통과\n")


if __name__ == "__main__":
    print("SCQ 모듈 테스트 시작...\n")
    
    try:
        test_scq_layer()
        test_scq_autoencoder()
        print("[OK] 모든 테스트 통과!")
    except Exception as e:
        print(f"[FAIL] 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

