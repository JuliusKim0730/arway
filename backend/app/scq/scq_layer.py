"""
SCQ (Soft Convex Quantization) Layer 구현

cvxpylayers를 사용한 미분 가능한 볼록 최적화 레이어
"""
import torch
import torch.nn as nn
import cvxpy as cp
from cvxpylayers.torch import CvxpyLayer
from typing import Optional, Tuple, Dict


class SCQLayer(nn.Module):
    """
    SCQ (Soft Convex Quantization) Layer
    
    입력 벡터를 코드북 벡터들의 볼록 결합으로 근사하는 미분 가능한 레이어
    
    Args:
        codebook_dim: 코드북 벡터의 차원 (d)
        num_codes: 코드북 크기 (K)
        lam: 정규화 계수 (λ)
        device: 디바이스 (cuda/cpu)
    """
    
    def __init__(
        self,
        codebook_dim: int,
        num_codes: int = 256,
        lam: float = 1e-3,
        device: Optional[torch.device] = None
    ):
        super(SCQLayer, self).__init__()
        
        self.codebook_dim = codebook_dim
        self.num_codes = num_codes
        self.lam = lam
        
        # 코드북 C ∈ R^{K×d} (학습 가능한 파라미터)
        self.codebook = nn.Parameter(
            torch.randn(num_codes, codebook_dim) * 0.01
        )
        
        # CVXPY 최적화 문제 정의
        self._setup_cvxpy_layer()
        
        if device is not None:
            self.to(device)
    
    def _setup_cvxpy_layer(self):
        """CVXPY 레이어 설정"""
        K = self.num_codes
        d = self.codebook_dim
        
        # 최적화 변수: α ∈ R^K
        alpha = cp.Variable(K)
        
        # 파라미터: z ∈ R^d, C ∈ R^{d×K}
        z_param = cp.Parameter(d)
        C_param = cp.Parameter((d, K))
        
        # 목적 함수: min ||z - C^T α||^2 + λ||α||^2
        objective = cp.Minimize(
            cp.sum_squares(z_param - C_param @ alpha) + 
            self.lam * cp.sum_squares(alpha)
        )
        
        # 제약 조건: α ≥ 0, 1^T α = 1 (simplex)
        constraints = [
            alpha >= 0,
            cp.sum(alpha) == 1
        ]
        
        # 최적화 문제 정의
        problem = cp.Problem(objective, constraints)
        
        # 미분 가능한 레이어 생성
        self.cvxpy_layer = CvxpyLayer(
            problem,
            parameters=[z_param, C_param],
            variables=[alpha]
        )
    
    def forward(
        self, 
        z: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, Dict]:
        """
        Forward pass
        
        Args:
            z: 입력 벡터 (B, d) 또는 (B, H, W, d)
        
        Returns:
            z_q: 양자화된 벡터 (z와 동일한 shape)
            alpha: 볼록 결합 계수 (B, K) 또는 (B, H, W, K)
            stats: 통계 정보 (entropy, sparsity 등)
        """
        original_shape = z.shape
        
        # Flatten 처리 (B, H, W, d) -> (B*H*W, d)
        if len(original_shape) == 4:
            B, H, W, d = original_shape
            z_flat = z.view(B * H * W, d)
            need_reshape = True
        else:
            z_flat = z
            need_reshape = False
        
        batch_size = z_flat.shape[0]
        
        # 배치 단위로 최적화 문제 해결
        alpha_list = []
        z_q_list = []
        
        for i in range(batch_size):
            z_i = z_flat[i]
            C = self.codebook.T  # (d, K)
            
            # CVXPY 레이어로 최적화
            alpha_i, = self.cvxpy_layer(z_i, C)
            
            # 양자화된 벡터 계산: z_q = C^T α
            z_q_i = torch.matmul(alpha_i, self.codebook)
            
            alpha_list.append(alpha_i)
            z_q_list.append(z_q_i)
        
        alpha_batch = torch.stack(alpha_list, dim=0)  # (B, K) 또는 (B*H*W, K)
        z_q_batch = torch.stack(z_q_list, dim=0)  # (B, d) 또는 (B*H*W, d)
        
        # 원래 shape로 복원
        if need_reshape:
            alpha_batch = alpha_batch.view(B, H, W, self.num_codes)
            z_q_batch = z_q_batch.view(B, H, W, d)
        
        # 통계 정보 계산
        entropy = self._compute_entropy(alpha_batch)
        sparsity = self._compute_sparsity(alpha_batch)
        
        stats = {
            'entropy': entropy,
            'sparsity': sparsity,
            'num_active_codes': self._count_active_codes(alpha_batch)
        }
        
        return z_q_batch, alpha_batch, stats
    
    def _compute_entropy(self, alpha: torch.Tensor) -> torch.Tensor:
        """엔트로피 계산 (코드북 사용 분산 측정)"""
        # 작은 값 추가하여 log(0) 방지
        alpha_safe = alpha + 1e-10
        entropy = -torch.sum(alpha_safe * torch.log(alpha_safe), dim=-1)
        return entropy.mean()
    
    def _compute_sparsity(self, alpha: torch.Tensor) -> torch.Tensor:
        """Sparsity 계산 (L1 norm 기반)"""
        sparsity = torch.norm(alpha, p=1, dim=-1)
        return sparsity.mean()
    
    def _count_active_codes(self, alpha: torch.Tensor, threshold: float = 1e-3) -> int:
        """활성 코드 수 계산"""
        active = (alpha > threshold).any(dim=0)
        return active.sum().item()
    
    def get_codebook(self) -> torch.Tensor:
        """코드북 반환"""
        return self.codebook
    
    def update_codebook_ema(self, z: torch.Tensor, alpha: torch.Tensor, decay: float = 0.99):
        """
        EMA 방식으로 코드북 업데이트 (선택적)
        
        Args:
            z: 입력 벡터
            alpha: 볼록 결합 계수
            decay: EMA 감쇠 계수
        """
        # 간단한 구현: 실제로는 더 정교한 EMA 업데이트 필요
        with torch.no_grad():
            # z의 가중 평균으로 코드북 업데이트
            z_flat = z.view(-1, self.codebook_dim)
            alpha_flat = alpha.view(-1, self.num_codes)
            
            # 각 코드북 벡터에 대한 가중 평균 계산
            for k in range(self.num_codes):
                weights = alpha_flat[:, k]
                if weights.sum() > 0:
                    weighted_z = (z_flat * weights.unsqueeze(1)).sum(dim=0) / weights.sum()
                    self.codebook.data[k] = (
                        decay * self.codebook.data[k] + 
                        (1 - decay) * weighted_z
                    )

