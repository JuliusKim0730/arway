📌 API 명세서 (API Specification)

본 서비스는 MVP이므로 대부분 오프라인 계산 기반
그러나 구조 확장을 위해 API 객체 설계 포함

1. Object Models
Target Object
{
  "id": "seoul_station",
  "name": "서울역 출구 1",
  "lat": 37.5561,
  "lng": 126.9723
}

2. Local Storage API
saveTarget()
saveTarget(targetObject)

getTarget()
targetObject = getTarget()

3. GeoLocation API
watchPosition()
navigator.geolocation.watchPosition(
 success(position) {...},
 error(err) {...},
 { enableHighAccuracy: true, timeout: 5000 }
)


returns:

{
 "coords": {
   "latitude": 37.511,
   "longitude": 127.029,
   "accuracy": 5
 }
}

4. Bearing Calculation API
import { getRhumbLineBearing } from "geolib"

bearing = getRhumbLineBearing(currentLatLng, targetLatLng)


Return example:

{
  "bearing": 112.28
}

5. Distance Calculation API
import { getDistance } from "geolib"
distance = getDistance(current, target)


return example:

{
  "meters": 325
}

6. Heading Calculation API

Two sources:

6.1 DeviceOrientation Web API
window.addEventListener("deviceorientation", handler)


returns:

{
 "alpha": 212.88,
 "beta": 15.22,
 "gamma": 6.21
}

6.2 Fallback

if missing:

GPS direction from last 2 position vectors

7. Render API (Pseudo)
updateArrowRotation(relativeAngle)

8. Arrival Detection
if(distance < 5) stopNavigator()

9. Error API
{
 "errorCode": 13001,
 "message": "GPS accuracy too low"
}

10. Analytics Event API
onArrive
analytics("arrive", {...})

onHeadingChanged
analytics("heading_update", {...})

onDistanceChanged
analytics("distance_update", {...})

📌 Bonus: 확장 대비 API 구조

미래에는 아래 확장 API 추가 예정:

기능	API
경로 계산	/path/find
turn-by-turn	/nav/turninfo
장소 검색	/search/location
자동차	/vehicle/nav