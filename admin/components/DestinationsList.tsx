'use client';

import { useEffect, useState } from 'react';
import { fetchDestinations, createDestination } from '@/lib/api';

interface Destination {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_active: boolean;
}

export default function DestinationsList() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
  });

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const data = await fetchDestinations();
      setDestinations(data);
    } catch (err) {
      console.error('목적지 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDestination({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        created_by: '00000000-0000-0000-0000-000000000000', // 임시 사용자 ID
      });
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        address: '',
      });
      loadDestinations();
    } catch (err) {
      console.error('목적지 생성 실패:', err);
      alert('목적지 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">목적지 목록</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? '취소' : '새 목적지 추가'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="설명"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="number"
              step="any"
              placeholder="위도"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="경도"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="주소"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="p-2 border rounded col-span-2"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            저장
          </button>
        </form>
      )}

      <div className="space-y-2">
        {destinations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            목적지가 없습니다.
          </div>
        ) : (
          destinations.map((dest) => (
            <div key={dest.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{dest.name}</h4>
                {dest.description && (
                  <p className="text-sm text-gray-600">{dest.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {dest.latitude}, {dest.longitude}
                </p>
                {dest.address && (
                  <p className="text-xs text-gray-500">{dest.address}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    dest.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {dest.is_active ? '활성' : '비활성'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

