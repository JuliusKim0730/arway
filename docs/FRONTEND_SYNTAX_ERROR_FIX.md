# 프론트엔드 Syntax Error 수정 가이드

## 문제 상황

브라우저 콘솔에서 다음과 같은 오류 발생:
```
layout.js:91 Uncaught SyntaxError: Invalid or unexpected token
```

## 원인 분석

1. **빌드 캐시 문제**: `.next` 폴더의 빌드된 파일에 문제가 있을 수 있음
2. **인코딩 문제**: 파일이 UTF-8로 저장되지 않아 한글 문자열 처리 실패
3. **Next.js 빌드 설정**: webpack 설정에서 인코딩 문제 발생 가능

## 해결 방법

### 1. 빌드 캐시 삭제

```powershell
cd "C:\Cursor Project\new_challange\frontend"
Remove-Item -Recurse -Force .next
```

### 2. 파일 인코딩 확인

`app/layout.tsx` 파일이 UTF-8로 저장되었는지 확인:

```powershell
# UTF-8로 재저장
$content = Get-Content "app\layout.tsx" -Raw -Encoding UTF8
[System.IO.File]::WriteAllText("$PWD\app\layout.tsx", $content, [System.Text.Encoding]::UTF8)
```

### 3. Next.js 설정 업데이트

`next.config.js` 파일에 UTF-8 인코딩 보장 설정 추가:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // UTF-8 인코딩 보장
  webpack: (config) => {
    config.output.charset = 'utf-8';
    return config;
  },
}

module.exports = nextConfig
```

### 4. 프론트엔드 서버 재시작

개발 서버 재시작:

```powershell
# 기존 서버 중지 (Ctrl+C)
# 새로 시작
npm run dev
```

또는 프로덕션 빌드:

```powershell
npm run build
npm start
```

## 확인 사항

1. **브라우저 콘솔 확인**
   - 개발자 도구(F12) 열기
   - Console 탭에서 오류 확인
   - 오류가 사라졌는지 확인

2. **빌드 로그 확인**
   - `npm run build` 실행 시 오류 확인
   - 경고 메시지 확인

3. **파일 인코딩 확인**
   - VS Code나 다른 에디터에서 파일 인코딩 확인
   - UTF-8로 설정되어 있는지 확인

## 추가 문제 해결

### 문제가 계속되면

1. **node_modules 재설치**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

2. **Next.js 캐시 완전 삭제**
   ```powershell
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules\.cache
   ```

3. **한글 문자열 이스케이프 처리**
   - 필요시 한글 문자열을 유니코드 이스케이프로 변경
   - 예: `'AR 도보 네비게이션'` → `'\u0041\u0052 \uB3C4\uBCF4 \uB124\uBE44\uAC8C\uC774\uC158'`

## 참고

- Next.js는 기본적으로 UTF-8을 지원하지만, Windows 환경에서 인코딩 문제가 발생할 수 있음
- 빌드 캐시를 정기적으로 삭제하면 문제 해결에 도움이 됨
- 파일 저장 시 항상 UTF-8 인코딩 사용 권장

