'use client';

import { useEffect, useState } from 'react';
import { fetchStats, fetchRecentSessions } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import SessionsTable from '@/components/SessionsTable';
import DestinationsList from '@/components/DestinationsList';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    averageRating: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, sessionsData] = await Promise.all([
        fetchStats(),
        fetchRecentSessions(),
      ]);
      setStats(statsData);
      setRecentSessions(sessionsData);
      setLoading(false);
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">ARWay Lite 관리자</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="전체 세션"
            value={stats.totalSessions}
            icon="📊"
          />
          <StatsCard
            title="활성 세션"
            value={stats.activeSessions}
            icon="🟢"
          />
          <StatsCard
            title="완료된 세션"
            value={stats.completedSessions}
            icon="✅"
          />
          <StatsCard
            title="평균 평점"
            value={stats.averageRating.toFixed(1)}
            icon="⭐"
          />
        </div>

        {/* 최근 세션 테이블 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">최근 세션</h2>
          </div>
          <SessionsTable sessions={recentSessions} />
        </div>

        {/* 목적지 관리 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">목적지 관리</h2>
          </div>
          <DestinationsList />
        </div>
      </main>
    </div>
  );
}

