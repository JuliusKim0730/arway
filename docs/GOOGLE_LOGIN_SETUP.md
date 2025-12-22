# Google 로그인 설정 가이드

**작성일**: 2024년 12월 19일  
**목적**: NextAuth.js를 사용한 Google OAuth 로그인 설정

---

## 📋 사전 준비

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 생성
3. "APIs & Services" > "Credentials" 메뉴 이동
4. "+ 자격 증명 만들기" > "OAuth 클라이언트 ID" 선택

### 2. OAuth 동의 화면 설정

1. "OAuth 동의 화면" 탭 클릭
2. 사용자 유형 선택:
   - **외부**: 일반 사용자 사용 가능
   - **내부**: Google Workspace 사용자만 사용 가능
3. 앱 정보 입력:
   - **앱 이름**: ARWay Lite
   - **사용자 지원 이메일**: 본인 이메일
   - **앱 로고**: 선택사항
4. 범위(Scopes) 추가:
   - `openid`
   - `email`
   - `profile`
5. 테스트 사용자 추가 (외부 사용자 유형 선택 시):
   - 본인 이메일 주소 추가
   - 앱 검토 전까지 테스트 사용자만 로그인 가능

### 3. OAuth 클라이언트 ID 생성

1. "자격 증명" 탭으로 이동
2. "+ 자격 증명 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: ARWay Lite Web Client
5. 승인된 JavaScript 원본:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
6. 승인된 리디렉션 URI:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
7. "만들기" 클릭
8. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

---

## ⚙️ 환경 변수 설정

### 프론트엔드 (`frontend/.env.local`)

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# 기존 설정
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### NEXTAUTH_SECRET 생성

**NEXTAUTH_SECRET은 무엇인가요?**
- NextAuth.js가 JWT 토큰을 암호화하고 서명하는 데 사용하는 비밀 키입니다
- 외부 서비스에서 가져오는 값이 **아닙니다**
- 직접 생성해야 하는 랜덤 암호화 키입니다

**생성 방법:**

1. **Windows PowerShell (Node.js 사용)**:
```powershell
cd frontend
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

2. **Linux/Mac (OpenSSL 사용)**:
```bash
openssl rand -base64 32
```

3. **온라인 생성기**:
- https://generate-secret.vercel.app/32

**생성된 값을 복사하여 `frontend/.env.local` 파일에 설정하세요:**
```env
NEXTAUTH_SECRET=q/XDRmOKQaHmUrctR4o+SPBIk31UW3CTt7/xuzrHoY8=
```

> ⚠️ **주의**: 이 값은 프로덕션 환경에서도 동일하게 사용해야 하며, 절대 공개되어서는 안 됩니다!

---

## 🔧 데이터베이스 마이그레이션

### User 모델 업데이트

User 테이블에 다음 컬럼 추가 필요:

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX idx_users_google_id ON users(google_id);
```

또는 Alembic 마이그레이션 생성:

```powershell
cd backend
.\venv\Scripts\python.exe -m alembic revision --autogenerate -m "add_google_auth_fields"
.\venv\Scripts\python.exe -m alembic upgrade head
```

---

## 🧪 테스트

### 1. 로그인 페이지 접속

```
http://localhost:3000/auth/signin
```

### 2. Google 로그인 버튼 클릭

- Google 계정 선택 화면 표시 확인
- 로그인 후 리디렉션 확인

### 3. 사용자 동기화 확인

- 백엔드 데이터베이스에서 사용자 생성 확인
- `google_id` 필드 확인

---

## 🚨 문제 해결

### "redirect_uri_mismatch" 에러

- Google Cloud Console에서 승인된 리디렉션 URI 확인
- 정확히 일치하는지 확인 (http/https, 포트 번호 등)

### "access_denied" 에러

- OAuth 동의 화면에서 테스트 사용자 추가 확인
- 앱 검토 상태 확인

### 세션이 유지되지 않는 경우

- `NEXTAUTH_SECRET` 확인
- 쿠키 설정 확인 (SameSite, Secure 등)

---

## 📝 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 설정
- [ ] OAuth 클라이언트 ID 생성
- [ ] 승인된 리디렉션 URI 설정
- [ ] 환경 변수 설정 (`frontend/.env.local`)
- [ ] `NEXTAUTH_SECRET` 생성 및 설정
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 로그인 테스트

---

**마지막 업데이트**: 2024년 12월 19일

