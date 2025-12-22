const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}/api/v1/analytics/stats`);
    if (!response.ok) {
      throw new Error('통계 데이터를 가져오는데 실패했습니다.');
    }
    return response.json();
  } catch (error) {
    console.error('통계 데이터 가져오기 실패:', error);
    // 기본값 반환
    return {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      averageRating: 0,
    };
  }
}

export async function fetchRecentSessions(limit = 10) {
  try {
    const response = await fetch(`${API_URL}/api/v1/sessions/?limit=${limit}`);
    if (!response.ok) {
      throw new Error('세션 데이터를 가져오는데 실패했습니다.');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch (error) {
    console.error('세션 데이터 가져오기 실패:', error);
    return [];
  }
}

export async function fetchDestinations() {
  try {
    const response = await fetch(`${API_URL}/api/v1/destinations/`);
    if (!response.ok) {
      throw new Error('목적지 데이터를 가져오는데 실패했습니다.');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch (error) {
    console.error('목적지 데이터 가져오기 실패:', error);
    return [];
  }
}

export async function createDestination(destination: {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_by: string;
}) {
  const response = await fetch(`${API_URL}/api/v1/destinations/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(destination),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '목적지 생성에 실패했습니다.');
  }

  return response.json();
}

export async function updateDestination(
  id: string,
  destination: Partial<{
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    is_active: boolean;
  }>
) {
  const response = await fetch(`${API_URL}/api/v1/destinations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(destination),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '목적지 수정에 실패했습니다.');
  }

  return response.json();
}

export async function deleteDestination(id: string) {
  const response = await fetch(`${API_URL}/api/v1/destinations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '목적지 삭제에 실패했습니다.');
  }

  return true;
}

