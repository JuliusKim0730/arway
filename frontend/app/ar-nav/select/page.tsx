'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession, syncUserFromGoogle, ApiError, fetchDestinations, addFavorite, removeFavorite, fetchUserFavorites, checkFavorite, type Destination, type Favorite } from '@/lib/api';
import { useNavigationStore } from '@/store/navigationStore';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { PlaceSearch, type PlaceResult } from '@/components/PlaceSearch';
import { DestinationSearch } from '@/components/DestinationSearch';
import { GoogleMap } from '@/components/GoogleMap';
import { TmapMap } from '@/components/TmapMap';
import { CurrentLocationButton } from '@/components/CurrentLocationButton';
import { isGoogleMapsAvailable } from '@/lib/googleMaps';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { arNavigationManager } from '@/services/ARNavigationManager';

export default function ArNavSelectPage() {
  const router = useRouter();
  const { setSessionId, setTargetLocation } = useNavigationStore();
  const { user, isAuthenticated, requireAuth, login } = useAuth();
  const toast = useToast();
  
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [startLocation, setStartLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.9780 }); // 서울 기본값
  const [loading, setLoading] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isKorea, setIsKorea] = useState(false);
  
  const { currentLocation: gpsLocation, getCurrentLocation } = useCurrentLocation();

  // 한국 여부 확인
  useEffect(() => {
    const location = currentLocation || gpsLocation || mapCenter;
    if (location) {
      const koreaCheck = arNavigationManager.checkIsKorea(location.lat, location.lng);
      setIsKorea(koreaCheck);
    }
  }, [currentLocation, gpsLocation, mapCenter]);

  // 페이지 언마운트 시 상태 초기화
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 모든 상태 초기화
      setSelectedPlace(null);
      setStartLocation(null);
      setDestinationLocation(null);
      setCurrentLocation(null);
      setClickedLocation(null);
      setShowLocationOptions(false);
    };
  }, []);

  // GPS 위치 가져오기
  useEffect(() => {
    const initLocation = async () => {
      try {
        await getCurrentLocation();
      } catch (err) {
        console.warn('초기 위치 가져오기 실패:', err);
      }
    };
    initLocation();
  }, [getCurrentLocation]);

  // GPS 위치가 업데이트되면 지도 중심 업데이트
  useEffect(() => {
    if (gpsLocation) {
      setCurrentLocation(gpsLocation);
      // 시작 위치가 없으면 GPS 위치를 시작 위치로 설정
      if (!startLocation) {
        setStartLocation(gpsLocation);
      }
      setMapCenter(gpsLocation);
    }
  }, [gpsLocation, startLocation]);

  // 즐겨찾기 목록 로드
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id]);

  // 선택된 목적지가 즐겨찾기에 있는지 확인
  useEffect(() => {
    if (selectedDestination && user?.id) {
      checkIsFavorite(selectedDestination.id);
    } else {
      setIsFavorite(false);
    }
  }, [selectedDestination, user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;
    try {
      const favs = await fetchUserFavorites(user.id);
      setFavorites(favs);
    } catch (err) {
      console.error('즐겨찾기 로드 실패:', err);
    }
  };

  const checkIsFavorite = async (destinationId: string) => {
    if (!user?.id) return;
    try {
      const favorite = await checkFavorite(user.id, destinationId);
      setIsFavorite(!!favorite);
    } catch (err) {
      setIsFavorite(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !selectedDestination) return;

    try {
      if (isFavorite) {
        await removeFavorite(user.id, selectedDestination.id);
        setIsFavorite(false);
        toast.success('즐겨찾기에서 제거되었습니다.');
        await loadFavorites();
      } else {
        await addFavorite(user.id, selectedDestination.id);
        setIsFavorite(true);
        toast.success('즐겨찾기에 추가되었습니다.');
        await loadFavorites();
      }
    } catch (err) {
      console.error('즐겨찾기 토글 실패:', err);
      toast.error('즐겨찾기 처리에 실패했습니다.');
    }
  };

  // 백엔드 목적지 선택 핸들러
  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestination(destination);
    setSelectedPlace(null); // Google Places 선택 해제
    
    const destPlace: PlaceResult = {
      place_id: destination.id,
      name: destination.name,
      formatted_address: destination.address || `${destination.latitude}, ${destination.longitude}`,
      geometry: {
        location: {
          lat: destination.latitude,
          lng: destination.longitude,
        },
      },
      types: [],
    };
    
    handlePlaceSelect(destPlace);
  };

  // 장소 선택 핸들러
  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    setDestinationLocation({
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    });
    setMapCenter({
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    });
  };

  // 지도 클릭 핸들러 - 시작/도착 선택 UI 표시
  const handleMapClick = (location: { lat: number; lng: number }) => {
    setClickedLocation(location);
    setShowLocationOptions(true);
  };

  // 시작 위치로 설정
  const handleSetAsStart = () => {
    if (clickedLocation) {
      setStartLocation(clickedLocation);
      // 현재 위치는 GPS 위치를 유지 (클릭한 위치로 덮어쓰지 않음)
      setMapCenter(clickedLocation);
      toast.success('시작 위치로 설정되었습니다.');
      setShowLocationOptions(false);
      setClickedLocation(null);
    }
  };

  // 도착 위치로 설정
  const handleSetAsDestination = () => {
    if (clickedLocation) {
      const clickedPlace: PlaceResult = {
        place_id: `manual_${Date.now()}`,
        name: '지도에서 선택한 위치',
        formatted_address: `${clickedLocation.lat.toFixed(6)}, ${clickedLocation.lng.toFixed(6)}`,
        geometry: {
          location: {
            lat: clickedLocation.lat,
            lng: clickedLocation.lng,
          },
        },
        types: [],
      };
      handlePlaceSelect(clickedPlace);
      toast.success('도착 위치로 설정되었습니다.');
      setShowLocationOptions(false);
      setClickedLocation(null);
    }
  };

  // 현재 위치 찾기 성공 핸들러 (useCallback으로 메모이제이션)
  const handleLocationFound = useCallback((location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    // 시작 위치가 없으면 GPS 위치를 시작 위치로 설정
    if (!startLocation) {
      setStartLocation(location);
    }
    setMapCenter(location);
    toast.success('현재 위치를 찾았습니다.');
  }, [toast, startLocation]);

  // 네비게이션 시작
  const handleStartNavigation = async () => {
    if (!destinationLocation) {
      toast.error('도착 위치를 선택해주세요.');
      return;
    }

    if (!startLocation) {
      toast.error('시작 위치를 설정해주세요.');
      return;
    }

    setLoading(true);

    try {
      // Google Maps API 사용 가능 여부 확인
      if (!isGoogleMapsAvailable()) {
        toast.warning('Google Maps API가 설정되지 않았습니다. 직선 경로로 안내됩니다.');
      }

      // 인증 확인 (이미 로그인되어 있어야 함 - 메인 페이지에서 체크)
      if (!isAuthenticated || !user) {
        toast.error('로그인이 필요합니다.');
        router.push('/auth/signin');
        setLoading(false);
        return;
      }

      // 백엔드 통신 시도 (오프라인 모드 대비)
      let backendUser = null;
      let sessionId = null;
      let isOfflineMode = false;

      try {
        // 백엔드에 사용자 동기화 시도
        backendUser = await syncUserFromGoogle({
          google_id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.image || undefined,
        });

        // 네비게이션 세션 생성 시도
        const session = await createSession({
          user_id: backendUser.id,
          destination_id: selectedDestination?.id,
          place_id: selectedPlace?.place_id,
          place_name: selectedPlace?.name || selectedDestination?.name || '지도에서 선택한 위치',
          place_address: selectedPlace?.formatted_address || selectedDestination?.address || `${destinationLocation.lat.toFixed(6)}, ${destinationLocation.lng.toFixed(6)}`,
          destination_latitude: destinationLocation.lat,
          destination_longitude: destinationLocation.lng,
          start_latitude: startLocation.lat,
          start_longitude: startLocation.lng,
        });

        sessionId = session.id;
        
        toast.success('서버 연결 성공! 네비게이션을 시작합니다.');
      } catch (err) {
        console.warn('백엔드 통신 실패, 오프라인 모드로 전환:', err);
        isOfflineMode = true;
        
        let errorMessage = '서버 연결을 확인할 수 없습니다.';
        
        if (err instanceof ApiError) {
          if (err.statusCode === 503) {
            errorMessage = '서버가 일시적으로 사용할 수 없습니다.';
          } else if (err.message.includes('데이터베이스')) {
            errorMessage = '데이터베이스 연결 오류가 발생했습니다.';
          } else if (err.isOffline) {
            errorMessage = '인터넷 연결을 확인해주세요.';
          } else {
            errorMessage = err.message;
          }
        }
        
        // 오프라인 모드 안내 토스트
        toast.warning(`${errorMessage} 오프라인 모드로 네비게이션을 시작합니다.`);
        
        // 오프라인용 임시 세션 ID 생성
        sessionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // 세션 ID와 목적지 정보 저장 (온라인/오프라인 모두)
      if (sessionId) {
        setSessionId(sessionId);
      }
      
      setTargetLocation({
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
      });

      // 세션 시작 이벤트 추적 (오프라인에서도 로컬 저장)
      trackEvent(AnalyticsEvents.SESSION_STARTED, {
        destination_id: selectedPlace?.place_id || 'unknown',
        destination_name: selectedPlace?.name || '지도에서 선택한 위치',
        has_google_maps: isGoogleMapsAvailable(),
        is_offline_mode: isOfflineMode,
        session_id: sessionId,
      });

      // 강제로 다음 페이지로 이동 (백엔드 연결 실패와 관계없이)
      console.log('네비게이션 시작 - 다음 페이지로 이동');
      router.push('/ar-nav/run');
      
    } catch (err) {
      // 예상치 못한 치명적 오류가 발생해도 네비게이션은 시작
      let errorMessage = '일부 기능이 제한될 수 있지만 네비게이션을 시작합니다.';
      
      if (err instanceof Error) {
        console.error('네비게이션 시작 중 오류:', err.message);
      }
      
      console.error('네비게이션 시작 중 오류:', err);
      toast.warning(errorMessage);
      
      // 오프라인용 임시 세션 ID 생성
      const fallbackSessionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(fallbackSessionId);
      setTargetLocation({
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
      });
      
      trackEvent(AnalyticsEvents.GPS_ERROR, { 
        error: errorMessage,
        context: 'navigation_start_fallback'
      });
      
      // 어떤 오류가 발생해도 네비게이션 페이지로 이동
      router.push('/ar-nav/run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <Link 
            href="/ar-nav" 
            className="mr-3 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded p-1 -ml-1"
            aria-label="뒤로 가기"
          >
            <span className="text-xl sm:text-2xl" aria-hidden="true">←</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-semibold">목적지 선택</h1>
        </div>
        <Link
          href="/ar-nav/history"
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2"
          aria-label="경로 히스토리"
        >
          <span className="text-xl sm:text-2xl" aria-hidden="true">📜</span>
        </Link>
      </header>

      {/* 검색 및 현재 위치 */}
      <div className="p-4 sm:p-6 space-y-3 border-b border-gray-700">
        <PlaceSearch
          onPlaceSelect={handlePlaceSelect}
          currentLocation={currentLocation}
          placeholder="장소 검색 (예: 강남역, 서울시청, 스타벅스)"
        />
        <DestinationSearch
          onDestinationSelect={handleDestinationSelect}
        />
        <div className="flex gap-2">
          <CurrentLocationButton
            onLocationFound={handleLocationFound}
          />
          {user?.id && (
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              ⭐ 즐겨찾기 {showFavorites ? '숨기기' : '보기'}
            </button>
          )}
        </div>
        {showFavorites && favorites.length > 0 && (
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => fav.destination && handleDestinationSelect(fav.destination)}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
              >
                <div className="text-sm font-medium text-white">{fav.destination?.name}</div>
                {fav.destination?.address && (
                  <div className="text-xs text-gray-400 mt-1">{fav.destination.address}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 및 선택된 장소 정보 */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0">
        {/* 지도 영역 */}
        <div className="flex-1 min-h-[300px] sm:min-h-0">
          {/* 한국이면 TMAP, 아니면 Google Maps */}
          {isKorea ? (
            <TmapMap
              center={mapCenter}
              zoom={selectedPlace ? 16 : 14}
              markers={[
                // 현재 위치 마커 (GPS 위치)
                ...(currentLocation ? [{
                  position: currentLocation,
                  label: '📍',
                  title: '현재 위치',
                  type: 'current' as const,
                }] : []),
                // 시작 위치 마커
                ...(startLocation ? [{
                  position: startLocation,
                  label: '시작',
                  title: '시작 위치',
                  type: 'start' as const,
                }] : []),
                // 도착 위치 마커
                ...(destinationLocation ? [{
                  position: destinationLocation,
                  label: '도착',
                  title: selectedPlace?.name || '도착 위치',
                  type: 'end' as const,
                }] : []),
              ]}
              onMapClick={handleMapClick}
              className="w-full h-full"
            />
          ) : (
            <GoogleMap
              center={mapCenter}
              zoom={selectedPlace ? 16 : 14}
              markers={[
                // 현재 위치 마커 (GPS 위치)
                ...(currentLocation ? [{
                  position: currentLocation,
                  label: '📍',
                  title: '현재 위치',
                }] : []),
                // 시작 위치 마커
                ...(startLocation ? [{
                  position: startLocation,
                  label: '시작',
                  title: '시작 위치',
                }] : []),
                // 도착 위치 마커
                ...(destinationLocation ? [{
                  position: destinationLocation,
                  label: '도착',
                  title: selectedPlace?.name || '도착 위치',
                }] : []),
              ]}
              onMapClick={handleMapClick}
              className="w-full h-full"
            />
          )}
        </div>

        {/* 위치 정보 및 컨트롤 패널 */}
        <div className="w-full sm:w-80 bg-gray-800 border-t sm:border-t-0 sm:border-l border-gray-700 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 space-y-4">
            {/* 시작 위치 */}
            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">시작 위치</p>
              {startLocation ? (
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    {startLocation.lat.toFixed(6)}, {startLocation.lng.toFixed(6)}
                  </p>
                  {currentLocation && Math.abs(startLocation.lat - currentLocation.lat) < 0.0001 && 
                   Math.abs(startLocation.lng - currentLocation.lng) < 0.0001 && (
                    <p className="text-xs text-green-400">✓ GPS 위치</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">지도에서 클릭하여 설정</p>
              )}
            </div>

            {/* 도착 위치 */}
            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">도착 위치</p>
                {selectedDestination && user?.id && (
                  <button
                    onClick={handleToggleFavorite}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    aria-label={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                  >
                    {isFavorite ? '⭐' : '☆'}
                  </button>
                )}
              </div>
              {destinationLocation ? (
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    {selectedPlace?.name || selectedDestination?.name || '지도에서 선택한 위치'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedPlace?.formatted_address || selectedDestination?.address || `${destinationLocation.lat.toFixed(6)}, ${destinationLocation.lng.toFixed(6)}`}
                  </p>
                  {selectedPlace?.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-gray-300 text-xs">
                        {selectedPlace.rating.toFixed(1)}
                        {selectedPlace.user_ratings_total && ` (${selectedPlace.user_ratings_total})`}
                      </span>
                    </div>
                  )}
                  {selectedDestination?.description && (
                    <p className="text-xs text-gray-500 mt-1">{selectedDestination.description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">검색하거나 지도에서 클릭하여 설정</p>
              )}
            </div>
          </div>

          {/* 네비게이션 시작 버튼 */}
          <button
            onClick={handleStartNavigation}
            disabled={loading || !startLocation || !destinationLocation}
            className={`
              w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
              text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
              disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50
              transform hover:scale-[1.02] active:scale-[0.98] mt-4
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                시작 중...
              </span>
            ) : (
              'AR 네비게이션 시작'
            )}
          </button>

          {(!startLocation || !destinationLocation) && (
            <p className="mt-2 text-xs text-yellow-400 text-center">
              {!startLocation && !destinationLocation && '시작 위치와 도착 위치를 설정해주세요.'}
              {!startLocation && destinationLocation && '시작 위치를 설정해주세요.'}
              {startLocation && !destinationLocation && '도착 위치를 설정해주세요.'}
            </p>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      {!destinationLocation && (
        <div className="p-4 sm:p-6 bg-blue-900/30 border-t border-blue-700/50">
          <p className="text-sm text-blue-200 text-center">
            🔍 위에서 장소를 검색하거나 지도를 클릭하여 시작/도착 위치를 설정해주세요.
          </p>
        </div>
      )}

      {/* 지도 클릭 시 시작/도착 선택 모달 */}
      {showLocationOptions && clickedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">위치 설정</h3>
            <p className="text-sm text-gray-400 mb-4">
              선택한 위치를 시작 또는 도착으로 설정하세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSetAsStart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                📍 시작 위치로 설정
              </button>
              <button
                onClick={handleSetAsDestination}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                🎯 도착 위치로 설정
              </button>
              <button
                onClick={() => {
                  setShowLocationOptions(false);
                  setClickedLocation(null);
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 알림 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
