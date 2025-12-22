# 빠른 서비스 테스트 가이드

**작성일**: 2024년 12월 22일

---

## 🚀 1분 안에 서비스 실행하기

### 자동화 스크립트 사용

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

**옵션 6 선택** → 전체 시스템 자동 실행

---

## 📍 접속 URL

| 서비스 | URL |
|--------|-----|
| **사용자 앱** | http://localhost:3000/ar-nav |
| **Admin 대시보드** | http://localhost:3001 |
| **API 문서** | http://localhost:8000/docs |
| **API Health** | http://localhost:8000/health |

---

## ✅ 빠른 테스트 체크리스트

### 기본 플로우
1. [ ] http://localhost:3000/ar-nav 접속
2. [ ] "도보 AR 네비 시작" 클릭
3. [ ] 목적지 선택
4. [ ] 위치 권한 허용
5. [ ] AR 네비게이션 확인
6. [ ] 도착 화면 확인

### 주요 기능
- [ ] 검색 기능 (목적지 선택 화면)
- [ ] 즐겨찾기 추가/제거
- [ ] 경로 히스토리 조회
- [ ] Admin 대시보드 접속

---

## 🔧 문제 발생 시

### 서버가 안 켜질 때
```powershell
# 포트 확인
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Docker 확인
docker-compose ps
```

### 데이터베이스 오류
```powershell
# Docker 재시작
docker-compose restart postgres
```

---

## 📚 상세 가이드

더 자세한 내용은 `SERVICE_TEST_GUIDE.md` 파일을 참조하세요.

---

**마지막 업데이트**: 2024년 12월 22일

