"""
AR 음식 인식용 SCQ 모델 학습 스크립트
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from pathlib import Path
import sys

# 프로젝트 루트를 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.scq.scq_autoencoder import SCQAutoencoder, compute_loss
from app.scq.utils import compute_psnr, compute_ssim, estimate_bitrate


class SimpleImageDataset(Dataset):
    """간단한 이미지 데이터셋 (예시)"""
    
    def __init__(self, images: torch.Tensor):
        """
        Args:
            images: 이미지 텐서 (N, C, H, W)
        """
        self.images = images
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        return self.images[idx]


def train_scq_food(
    model: SCQAutoencoder,
    train_loader: DataLoader,
    num_epochs: int = 10,
    device: torch.device = None,
    save_dir: Path = None
):
    """
    AR 음식 인식용 SCQ 모델 학습
    
    Args:
        model: SCQ Autoencoder 모델
        train_loader: 학습 데이터 로더
        num_epochs: 에폭 수
        device: 디바이스
        save_dir: 모델 저장 디렉토리
    """
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    model = model.to(device)
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    
    print(f"학습 시작: 디바이스={device}, 에폭={num_epochs}")
    
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0.0
        
        for batch_idx, x in enumerate(train_loader):
            x = x.to(device)
            
            # Forward pass
            x_recon, z, z_q, stats = model(x)
            
            # 손실 계산
            loss, loss_dict = compute_loss(
                x_recon, x, z, z_q, stats,
                recon_weight=1.0,
                commitment_weight=0.25,
                entropy_weight=0.01
            )
            
            # 역전파
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss_dict['total_loss']
            
            if batch_idx % 10 == 0:
                print(
                    f"Epoch {epoch+1}/{num_epochs}, "
                    f"Batch {batch_idx}, "
                    f"Loss: {loss_dict['total_loss']:.4f}"
                )
        
        avg_loss = total_loss / len(train_loader)
        print(f"\nEpoch {epoch+1} 완료: Avg Loss: {avg_loss:.4f}\n")
        
        # 모델 저장
        if save_dir is not None:
            save_dir.mkdir(parents=True, exist_ok=True)
            torch.save(
                model.state_dict(),
                save_dir / f"scq_food_epoch_{epoch+1}.pth"
            )
    
    print("학습 완료!")


def main():
    """메인 함수"""
    # 설정
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    batch_size = 32
    num_epochs = 10
    latent_dim = 128
    num_codes = 256
    
    # 모델 생성
    model = SCQAutoencoder(
        input_channels=3,
        latent_dim=latent_dim,
        num_codes=num_codes,
        scq_lambda=1e-3,
        device=device
    )
    
    # 더미 데이터 생성 (실제로는 데이터셋 로드)
    print("⚠️ 더미 데이터를 사용합니다. 실제 데이터셋으로 교체하세요.")
    dummy_images = torch.randn(100, 3, 64, 64)
    dataset = SimpleImageDataset(dummy_images)
    train_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # 학습
    save_dir = Path(__file__).parent / "checkpoints"
    train_scq_food(
        model=model,
        train_loader=train_loader,
        num_epochs=num_epochs,
        device=device,
        save_dir=save_dir
    )


if __name__ == "__main__":
    main()

