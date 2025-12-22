import Link from 'next/link';

interface Session {
  id: string;
  user_id: string;
  destination_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_distance?: number;
}

interface SessionsTableProps {
  sessions: Session[];
}

export default function SessionsTable({ sessions }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        세션이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              세션 ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              시작 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              거리
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {session.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : session.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(session.started_at).toLocaleString('ko-KR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {session.total_distance
                  ? `${(Number(session.total_distance) / 1000).toFixed(2)}km`
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link
                  href={`/admin/sessions/${session.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  상세보기
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

