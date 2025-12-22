"""
SCQ Autoencoder 구현

Encoder + SCQ Layer + Decoder 구조
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple, Dict
from app.scq.scq_layer import SCQLayer


class SimpleEncoder(nn.Module):
    """간단한 CNN 인코더"""
    
    def __init__(self, input_channels: int = 3, latent_dim: int = 128):
        super(SimpleEncoder, self).__init__()
        
        self.conv_layers = nn.Sequential(
            # 첫 번째 블록
            nn.Conv2d(input_channels, 64, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 두 번째 블록
            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 세 번째 블록
            nn.Conv2d(128, 256, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 최종 블록
            nn.Conv2d(256, latent_dim, kernel_size=4, stride=2, padding=1),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: 입력 이미지 (B, C, H, W)
        Returns:
            z: 잠재 벡터 (B, D, H', W')
        """
        return self.conv_layers(x)


class SimpleDecoder(nn.Module):
    """간단한 CNN 디코더"""
    
    def __init__(self, latent_dim: int = 128, output_channels: int = 3):
        super(SimpleDecoder, self).__init__()
        
        self.conv_layers = nn.Sequential(
            # 첫 번째 블록
            nn.ConvTranspose2d(latent_dim, 256, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 두 번째 블록
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 세 번째 블록
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            
            # 최종 블록
            nn.ConvTranspose2d(64, output_channels, kernel_size=4, stride=2, padding=1),
            nn.Tanh()  # [-1, 1] 범위로 정규화
        )
    
    def forward(self, z_q: torch.Tensor) -> torch.Tensor:
        """
        Args:
            z_q: 양자화된 잠재 벡터 (B, D, H', W')
        Returns:
            x_recon: 재구성된 이미지 (B, C, H, W)
        """
        return self.conv_layers(z_q)


class SCQAutoencoder(nn.Module):
    """
    SCQ 기반 Autoencoder
    
    Encoder → SCQ Layer → Decoder 구조
    """
    
    def __init__(
        self,
        input_channels: int = 3,
        latent_dim: int = 128,
        num_codes: int = 256,
        scq_lambda: float = 1e-3,
        device: Optional[torch.device] = None
    ):
        super(SCQAutoencoder, self).__init__()
        
        self.latent_dim = latent_dim
        self.num_codes = num_codes
        
        # 인코더
        self.encoder = SimpleEncoder(input_channels, latent_dim)
        
        # SCQ 레이어
        self.scq_layer = SCQLayer(
            codebook_dim=latent_dim,
            num_codes=num_codes,
            lam=scq_lambda,
            device=device
        )
        
        # 디코더
        self.decoder = SimpleDecoder(latent_dim, input_channels)
        
        if device is not None:
            self.to(device)
    
    def forward(
        self, 
        x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, Dict]:
        """
        Forward pass
        
        Args:
            x: 입력 이미지 (B, C, H, W)
        
        Returns:
            x_recon: 재구성된 이미지 (B, C, H, W)
            z: 인코더 출력 (B, D, H', W')
            z_q: 양자화된 벡터 (B, D, H', W')
            stats: SCQ 통계 정보
        """
        # 인코딩
        z = self.encoder(x)  # (B, D, H', W')
        
        # SCQ 양자화
        # SCQ 레이어는 (B, H, W, D) 형태를 기대하므로 transpose 필요
        B, D, H, W = z.shape
        z_reshaped = z.permute(0, 2, 3, 1).contiguous()  # (B, H, W, D)
        
        z_q_reshaped, alpha, stats = self.scq_layer(z_reshaped)
        
        # 다시 (B, D, H, W) 형태로 변환
        z_q = z_q_reshaped.permute(0, 3, 1, 2).contiguous()  # (B, D, H, W)
        
        # 디코딩
        x_recon = self.decoder(z_q)
        
        return x_recon, z, z_q, stats
    
    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """인코딩만 수행"""
        return self.encoder(x)
    
    def quantize(self, z: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, Dict]:
        """양자화만 수행"""
        B, D, H, W = z.shape
        z_reshaped = z.permute(0, 2, 3, 1).contiguous()
        z_q_reshaped, alpha, stats = self.scq_layer(z_reshaped)
        z_q = z_q_reshaped.permute(0, 3, 1, 2).contiguous()
        return z_q, alpha, stats
    
    def decode(self, z_q: torch.Tensor) -> torch.Tensor:
        """디코딩만 수행"""
        return self.decoder(z_q)


def compute_loss(
    x_recon: torch.Tensor,
    x_target: torch.Tensor,
    z: torch.Tensor,
    z_q: torch.Tensor,
    stats: Dict,
    recon_weight: float = 1.0,
    commitment_weight: float = 0.25,
    entropy_weight: float = 0.01
) -> Tuple[torch.Tensor, Dict]:
    """
    SCQ Autoencoder 손실 함수 계산
    
    Args:
        x_recon: 재구성된 이미지
        x_target: 타겟 이미지
        z: 인코더 출력
        z_q: 양자화된 벡터
        stats: SCQ 통계 정보
        recon_weight: 재구성 손실 가중치
        commitment_weight: Commitment 손실 가중치
        entropy_weight: 엔트로피 정규화 가중치
    
    Returns:
        total_loss: 총 손실
        loss_dict: 개별 손실 항목
    """
    # 재구성 손실 (MSE)
    recon_loss = F.mse_loss(x_recon, x_target)
    
    # Commitment 손실 (인코더 출력과 양자화된 벡터 간 거리)
    commitment_loss = F.mse_loss(z, z_q.detach())
    
    # 엔트로피 정규화 (코드북 사용 분산 증가)
    entropy_loss = -stats['entropy']  # 엔트로피를 최대화
    
    # 총 손실
    total_loss = (
        recon_weight * recon_loss +
        commitment_weight * commitment_loss +
        entropy_weight * entropy_loss
    )
    
    loss_dict = {
        'total_loss': total_loss.item(),
        'recon_loss': recon_loss.item(),
        'commitment_loss': commitment_loss.item(),
        'entropy_loss': entropy_loss.item(),
        'entropy': stats['entropy'].item(),
        'sparsity': stats['sparsity'].item(),
        'num_active_codes': stats['num_active_codes']
    }
    
    return total_loss, loss_dict

