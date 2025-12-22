/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ArNavStartPage from '@/app/ar-nav/page';
import { useRouter } from 'next/navigation';

// Next.js router 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ArNavStartPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('시작 화면이 렌더링됩니다', () => {
    render(<ArNavStartPage />);
    
    expect(screen.getByText('ARWay Lite')).toBeInTheDocument();
    expect(screen.getByText('도보 AR 네비 시작')).toBeInTheDocument();
  });

  it('시작 버튼 클릭 시 목적지 선택 화면으로 이동합니다', () => {
    render(<ArNavStartPage />);
    
    const startButton = screen.getByText('도보 AR 네비 시작');
    startButton.click();
    
    expect(mockPush).toHaveBeenCalledWith('/ar-nav/select');
  });

  it('서비스 설명이 표시됩니다', () => {
    render(<ArNavStartPage />);
    
    expect(screen.getByText(/지도를 보지 않고도/)).toBeInTheDocument();
    expect(screen.getByText(/도보 테스트용으로만 사용해주세요/)).toBeInTheDocument();
  });
});

