# PowerShell 한글 인코딩 최종 해결 방법

**작성일**: 2024년 12월 22일  
**문제**: PowerShell에서 한글이 깨져서 표시됨

---

## 🔍 문제 원인

PowerShell 콘솔의 기본 코드 페이지가 **949 (한국어)**로 설정되어 있어서 UTF-8 파일의 한글이 깨집니다.

---

## ✅ 해결 방법

### 방법 1: 실행 전 코드 페이지 변경 (권장)

**PowerShell을 실행하기 전에** 다음 명령어를 실행:

```powershell
chcp 65001
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

또는 한 줄로:

```powershell
chcp 65001; cd "C:\Cursor Project\new_challange"; .\scripts\test.ps1
```

### 방법 2: 래퍼 스크립트 사용

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\run_with_utf8.ps1 test.ps1
```

### 방법 3: Windows Terminal 사용 (가장 권장)

Windows Terminal을 사용하면 UTF-8이 기본적으로 지원됩니다:

1. **Microsoft Store에서 Windows Terminal 설치**
2. **Windows Terminal에서 PowerShell 실행**
3. **스크립트 실행**:
   ```powershell
   cd "C:\Cursor Project\new_challange"
   .\scripts\test.ps1
   ```

### 방법 4: PowerShell 프로필에 설정 추가 (영구 해결)

PowerShell 프로필에 UTF-8 설정을 추가하면 모든 세션에서 자동 적용됩니다:

```powershell
# 프로필 파일 위치 확인
$PROFILE

# 프로필 파일 편집
notepad $PROFILE
```

프로필 파일에 다음 내용 추가:

```powershell
# UTF-8 인코딩 설정
chcp 65001 | Out-Null
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

프로필 저장 후 PowerShell 재시작.

---

## 🚀 빠른 실행 명령어

### 옵션 A: 코드 페이지 변경 후 실행

```powershell
chcp 65001
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

### 옵션 B: 래퍼 스크립트 사용

```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\run_with_utf8.ps1 test.ps1
```

### 옵션 C: Windows Terminal 사용

Windows Terminal에서:
```powershell
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

---

## 📝 수정된 파일

1. **`scripts/test.ps1`** - 강화된 UTF-8 인코딩 설정 추가
2. **`scripts/run_with_utf8.ps1`** - UTF-8 래퍼 스크립트 생성

---

## ✅ 테스트

다음 명령어로 테스트:

```powershell
chcp 65001
cd "C:\Cursor Project\new_challange"
.\scripts\test.ps1
```

**예상 출력** (정상):
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

선택 (1-6):
```

---

## 🔧 추가 팁

### 현재 코드 페이지 확인

```powershell
chcp
# 출력: 활성 코드 페이지: 65001 (UTF-8) 또는 949 (한국어)
```

### 코드 페이지 변경

```powershell
# UTF-8로 변경
chcp 65001

# 한국어로 변경 (기본값)
chcp 949
```

### PowerShell 실행 정책 확인

```powershell
Get-ExecutionPolicy

# 필요시 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 참고사항

- **Windows Terminal 사용을 강력히 권장합니다** - UTF-8이 기본 지원되어 별도 설정 불필요
- 스크립트 파일 자체는 UTF-8 BOM으로 저장되어 있습니다
- 스크립트 내부의 인코딩 설정은 실행 시 적용되지만, 콘솔 코드 페이지가 949면 여전히 깨질 수 있습니다

---

**마지막 업데이트**: 2024년 12월 22일

