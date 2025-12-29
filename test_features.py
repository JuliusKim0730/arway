"""
기능 테스트 스크립트
- 백엔드 목적지 검색 테스트
- 즐겨찾기 추가/제거 테스트
"""
import requests
import json
from uuid import UUID

BASE_URL = "http://localhost:8000/api/v1"

def test_destination_search():
    """백엔드 목적지 검색 테스트"""
    print("=" * 70)
    print("1. 백엔드 목적지 검색 테스트")
    print("=" * 70)
    
    # 전체 목적지 조회
    print("\n[테스트 1-1] 전체 목적지 조회")
    try:
        response = requests.get(f"{BASE_URL}/destinations/")
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            destinations = response.json()
            print(f"✅ 성공: {len(destinations)}개의 목적지 조회됨")
            if destinations:
                print(f"   첫 번째 목적지: {destinations[0].get('name', 'N/A')}")
        else:
            print(f"❌ 실패: {response.text}")
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
    
    # 검색어로 목적지 검색
    print("\n[테스트 1-2] 검색어로 목적지 검색 (검색어: '서울')")
    try:
        response = requests.get(f"{BASE_URL}/destinations/?search=서울")
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            destinations = response.json()
            print(f"✅ 성공: {len(destinations)}개의 검색 결과")
            for dest in destinations[:3]:  # 처음 3개만 출력
                print(f"   - {dest.get('name', 'N/A')}: {dest.get('address', 'N/A')}")
        else:
            print(f"❌ 실패: {response.text}")
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
    
    # 빈 검색어 테스트
    print("\n[테스트 1-3] 빈 검색어 테스트")
    try:
        response = requests.get(f"{BASE_URL}/destinations/?search=")
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            destinations = response.json()
            print(f"✅ 성공: {len(destinations)}개의 목적지 (전체 조회)")
        else:
            print(f"❌ 실패: {response.text}")
    except Exception as e:
        print(f"❌ 오류: {str(e)}")

def test_favorites():
    """즐겨찾기 추가/제거 테스트"""
    print("\n" + "=" * 70)
    print("2. 즐겨찾기 추가/제거 테스트")
    print("=" * 70)
    
    # 테스트용 사용자 ID와 목적지 ID 필요
    # 실제 데이터베이스에서 가져와야 함
    print("\n[테스트 2-1] 사용자 목록 조회 (테스트용)")
    try:
        response = requests.get(f"{BASE_URL}/users/")
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            users = response.json()
            print(f"✅ 성공: {len(users)}명의 사용자")
            if users:
                test_user_id = users[0].get('id')
                print(f"   테스트 사용자 ID: {test_user_id}")
                
                # 목적지 목록 조회
                print("\n[테스트 2-2] 목적지 목록 조회")
                dest_response = requests.get(f"{BASE_URL}/destinations/")
                if dest_response.status_code == 200:
                    destinations = dest_response.json()
                    if destinations:
                        test_dest_id = destinations[0].get('id')
                        print(f"   테스트 목적지 ID: {test_dest_id}")
                        print(f"   목적지 이름: {destinations[0].get('name', 'N/A')}")
                        
                        # 즐겨찾기 추가 테스트
                        print("\n[테스트 2-3] 즐겨찾기 추가")
                        try:
                            fav_data = {
                                "user_id": test_user_id,
                                "destination_id": test_dest_id
                            }
                            fav_response = requests.post(
                                f"{BASE_URL}/favorites/",
                                json=fav_data
                            )
                            print(f"   상태 코드: {fav_response.status_code}")
                            if fav_response.status_code == 200:
                                favorite = fav_response.json()
                                print(f"   ✅ 성공: 즐겨찾기 추가됨")
                                print(f"   즐겨찾기 ID: {favorite.get('id', 'N/A')}")
                                
                                # 즐겨찾기 확인
                                print("\n[테스트 2-4] 즐겨찾기 확인")
                                check_response = requests.get(
                                    f"{BASE_URL}/favorites/user/{test_user_id}/destination/{test_dest_id}"
                                )
                                print(f"   상태 코드: {check_response.status_code}")
                                if check_response.status_code == 200:
                                    print(f"   ✅ 성공: 즐겨찾기 확인됨")
                                else:
                                    print(f"   ⚠️ 확인 실패: {check_response.text}")
                                
                                # 즐겨찾기 목록 조회
                                print("\n[테스트 2-5] 사용자 즐겨찾기 목록 조회")
                                list_response = requests.get(
                                    f"{BASE_URL}/favorites/user/{test_user_id}"
                                )
                                print(f"   상태 코드: {list_response.status_code}")
                                if list_response.status_code == 200:
                                    favorites = list_response.json()
                                    print(f"   ✅ 성공: {len(favorites)}개의 즐겨찾기")
                                    for fav in favorites:
                                        print(f"   - {fav.get('destination', {}).get('name', 'N/A') if fav.get('destination') else 'N/A'}")
                                
                                # 즐겨찾기 제거 테스트
                                print("\n[테스트 2-6] 즐겨찾기 제거")
                                delete_response = requests.delete(
                                    f"{BASE_URL}/favorites/user/{test_user_id}/destination/{test_dest_id}"
                                )
                                print(f"   상태 코드: {delete_response.status_code}")
                                if delete_response.status_code == 200:
                                    print(f"   ✅ 성공: 즐겨찾기 제거됨")
                                    
                                    # 제거 확인
                                    print("\n[테스트 2-7] 제거 확인")
                                    verify_response = requests.get(
                                        f"{BASE_URL}/favorites/user/{test_user_id}/destination/{test_dest_id}"
                                    )
                                    print(f"   상태 코드: {verify_response.status_code}")
                                    if verify_response.status_code == 404:
                                        print(f"   ✅ 성공: 즐겨찾기가 제거되었음을 확인")
                                    else:
                                        print(f"   ⚠️ 확인 실패: {verify_response.text}")
                                else:
                                    print(f"   ❌ 실패: {delete_response.text}")
                            elif fav_response.status_code == 400:
                                print(f"   ⚠️ 이미 즐겨찾기에 추가된 목적지입니다.")
                            else:
                                print(f"   ❌ 실패: {fav_response.text}")
                        except Exception as e:
                            print(f"   ❌ 오류: {str(e)}")
                    else:
                        print("   ⚠️ 목적지가 없습니다.")
                else:
                    print(f"   ❌ 목적지 조회 실패: {dest_response.text}")
            else:
                print("   ⚠️ 사용자가 없습니다.")
        else:
            print(f"❌ 실패: {response.text}")
    except Exception as e:
        print(f"❌ 오류: {str(e)}")

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("기능 테스트 시작")
    print("=" * 70)
    
    test_destination_search()
    test_favorites()
    
    print("\n" + "=" * 70)
    print("테스트 완료")
    print("=" * 70)

