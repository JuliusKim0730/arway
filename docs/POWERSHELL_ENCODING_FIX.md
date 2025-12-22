# PowerShell 한글 인코딩 문제 해결 가이드

**작성일**: 2024년 12월 22일  
**문제**: PowerShell에서 한글이 깨져서 표시됨

---

## ✅ 해결 방법

### 스크립트에 UTF-8 인코딩 설정 추가됨

`scripts/test.ps1` 파일 시작 부분에 다음 코드가 추가되었습니다:

```powershell
# UTF-8 인코딩 설정 (한글 출력을 위해 필요)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

이제 스크립트를 실행하면 한글이 정상적으로 표시됩니다.

---

## 🚀 사용 방법

### 스크립트 실행

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

스크립트가 자동으로 UTF-8 인코딩을 설정하므로 한글이 정상적으로 표시됩니다.

---

## 🔧 추가 해결 방법 (필요한 경우)

### 방법 1: PowerShell 프로필에 인코딩 설정 추가

PowerShell 프로필 파일을 편집합니다:

```powershell
# 프로필 파일 위치 확인
$PROFILE

# 프로필 파일 편집
notepad $PROFILE
```

프로필 파일에 다음 내용 추가:

```powershell
# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

프로필을 저장하고 PowerShell을 재시작합니다.

### 방법 2: PowerShell 시작 시 자동 설정

PowerShell을 시작할 때마다 자동으로 UTF-8을 설정하려면:

1. Windows 설정 → 시간 및 언어 → 언어 및 지역
2. 관리 언어 설정 → 시스템 로캘 변경
3. "Beta: Use Unicode UTF-8 for worldwide language support" 체크
4. 재부팅

### 방법 3: Windows Terminal 사용 (권장)

Windows Terminal을 사용하면 UTF-8 인코딩이 기본적으로 지원됩니다:

1. Microsoft Store에서 Windows Terminal 설치
2. Windows Terminal에서 PowerShell 실행
3. 한글이 정상적으로 표시됨

---

## 📝 확인 방법

스크립트를 실행했을 때 다음과 같이 한글이 정상적으로 표시되어야 합니다:

```
========================================
ARWay Lite 테스트 실행
========================================

테스트 타입을 선택하세요:
1. 백엔드 테스트만 실행
2. 프론트엔드 테스트만 실행
3. 전체 테스트 실행
4. 백엔드 서버 실행 (API 테스트용)
5. 프론트엔드 서버 실행
6. 전체 시스템 실행 (Docker + Backend + Frontend)
```

---

## 🐛 문제 해결

### 여전히 한글이 깨져 보이는 경우

1. **PowerShell 재시작**: 현재 세션을 종료하고 새로 시작
2. **Windows Terminal 사용**: Windows Terminal에서 실행
3. **프로필 설정 확인**: `$PROFILE` 파일에 UTF-8 설정이 있는지 확인

### 스크립트 실행 오류

```powershell
# 실행 정책 확인
Get-ExecutionPolicy

# 실행 정책 변경 (필요한 경우)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 참고사항

- 스크립트 파일 자체는 UTF-8로 저장되어 있습니다
- 스크립트 실행 시 자동으로 UTF-8 인코딩이 설정됩니다
- 새로 열린 PowerShell 창에도 UTF-8 설정이 적용됩니다 (옵션 6의 경우)

---

**마지막 업데이트**: 2024년 12월 22일

