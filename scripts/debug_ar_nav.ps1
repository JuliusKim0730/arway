# AR Navigation Debug and Status Check Script
# PowerShell Script

# UTF-8 encoding settings
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change code page to UTF-8
try {
    chcp 65001 | Out-Null
} catch {
    # Ignore if chcp fails
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AR Navigation Debug and Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# API base URLs
$apiUrl = "http://localhost:8000"
$frontendUrl = "http://localhost:3000"

# Results storage
$results = @()

# ========================================
# 1. Backend API Server Status Check
# ========================================
Write-Host "[1/5] Checking backend API server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/docs" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] Backend API server is running" -ForegroundColor Green
        $results += @{Name="Backend API Server"; Status="[OK] Normal"; Details="http://localhost:8000"}
    } else {
        Write-Host "  [WARN] Backend API server response abnormal (Status code: $($response.StatusCode))" -ForegroundColor Yellow
        $results += @{Name="Backend API Server"; Status="[WARN] Abnormal"; Details="Status code: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  [ERROR] Backend API server connection failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     Solution: Please start backend server (Option 4)" -ForegroundColor Yellow
    $results += @{Name="Backend API Server"; Status="[ERROR] Failed"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 2. Destination Search API Test
# ========================================
Write-Host "[2/5] Testing destination search API..." -ForegroundColor Yellow
try {
    # Get all destinations
    Write-Host "  Attempting to call: $apiUrl/api/v1/destinations/" -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$apiUrl/api/v1/destinations/" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response -and $response.Count -ge 0) {
        Write-Host "  [OK] Destination list retrieved successfully (Total: $($response.Count))" -ForegroundColor Green
        $results += @{Name="Destination List"; Status="[OK] Normal"; Details="$($response.Count) destinations"}
        
        # Test search functionality
        if ($response.Count -gt 0) {
            $testSearchTerm = $response[0].name.Substring(0, [Math]::Min(3, $response[0].name.Length))
            try {
                $searchResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/destinations/?search=$testSearchTerm" -Method Get -TimeoutSec 5 -ErrorAction Stop
                Write-Host "  [OK] Destination search functionality working" -ForegroundColor Green
                $results += @{Name="Destination Search"; Status="[OK] Normal"; Details="Search term: '$testSearchTerm'"}
            } catch {
                Write-Host "  [WARN] Destination search test failed" -ForegroundColor Yellow
                $results += @{Name="Destination Search"; Status="[WARN] Failed"; Details=$_.Exception.Message}
            }
        } else {
            Write-Host "  [WARN] No destinations found, skipping search test" -ForegroundColor Yellow
            $results += @{Name="Destination Search"; Status="[WARN] Skipped"; Details="No destinations"}
        }
    } else {
        Write-Host "  [WARN] Destination list is empty" -ForegroundColor Yellow
        $results += @{Name="Destination List"; Status="[WARN] Empty"; Details="0 destinations"}
    }
} catch {
    Write-Host "  [ERROR] Destination API call failed" -ForegroundColor Red
    $errorMsg = $_.Exception.Message
    Write-Host "     Error: $errorMsg" -ForegroundColor Red
    
    # Check if it's a 500 error and suggest database migration
    if ($errorMsg -like "*500*" -or $errorMsg -like "*Internal Server Error*") {
        Write-Host "     [TIP] This might be a database issue. Try running:" -ForegroundColor Yellow
        Write-Host "            cd backend" -ForegroundColor Yellow
        Write-Host "            alembic upgrade head" -ForegroundColor Yellow
        Write-Host "            python app/database/seeds.py" -ForegroundColor Yellow
    }
    
    $results += @{Name="Destination API"; Status="[ERROR] Failed"; Details=$errorMsg}
}
Write-Host ""

# ========================================
# 3. Session Creation API Test
# ========================================
Write-Host "[3/5] Testing session creation API..." -ForegroundColor Yellow
try {
    # First, create or get user
    $userData = @{
        email = "test@arway.com"
        name = "Test User"
    }
    try {
        $user = Invoke-RestMethod -Uri "$apiUrl/api/v1/users/" -Method Post -Body ($userData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  [OK] Test user created/retrieved successfully (ID: $($user.id))" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] User creation failed (may already exist)" -ForegroundColor Yellow
    }
    
    # Test session creation if destinations exist
    try {
        $destinations = Invoke-RestMethod -Uri "$apiUrl/api/v1/destinations/" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($destinations -and $destinations.Count -gt 0) {
            $sessionData = @{
                user_id = $user.id
                destination_id = $destinations[0].id
                start_latitude = 37.5665
                start_longitude = 126.9780
            }
            $session = Invoke-RestMethod -Uri "$apiUrl/api/v1/sessions/" -Method Post -Body ($sessionData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "  [OK] Session created successfully (ID: $($session.id))" -ForegroundColor Green
            $results += @{Name="Session Creation API"; Status="[OK] Normal"; Details="Session ID: $($session.id)"}
        } else {
            Write-Host "  [WARN] No destinations found, skipping session creation test" -ForegroundColor Yellow
            $results += @{Name="Session Creation API"; Status="[WARN] Skipped"; Details="No destinations"}
        }
    } catch {
        Write-Host "  [ERROR] Session creation failed" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{Name="Session Creation API"; Status="[ERROR] Failed"; Details=$_.Exception.Message}
    }
} catch {
    Write-Host "  [ERROR] Session API test failed" -ForegroundColor Red
    $results += @{Name="Session API"; Status="[ERROR] Failed"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 4. Frontend Server Status Check
# ========================================
Write-Host "[4/5] Checking frontend server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$frontendUrl" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] Frontend server is running" -ForegroundColor Green
        $results += @{Name="Frontend Server"; Status="[OK] Normal"; Details="http://localhost:3000"}
    } else {
        Write-Host "  [WARN] Frontend server response abnormal (Status code: $($response.StatusCode))" -ForegroundColor Yellow
        $results += @{Name="Frontend Server"; Status="[WARN] Abnormal"; Details="Status code: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  [ERROR] Frontend server connection failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     Solution: Please start frontend server (Option 5)" -ForegroundColor Yellow
    $results += @{Name="Frontend Server"; Status="[ERROR] Failed"; Details=$_.Exception.Message}
}
Write-Host ""

# ========================================
# 5. Browser Function Check Guide
# ========================================
Write-Host "[5/5] Browser function check guide..." -ForegroundColor Yellow
Write-Host "  [INFO] Please check the following functions in browser:" -ForegroundColor Cyan
Write-Host "     1. Video camera access permission" -ForegroundColor White
Write-Host "     2. GPS location permission" -ForegroundColor White
Write-Host "     3. DeviceOrientation permission (iOS)" -ForegroundColor White
Write-Host ""
Write-Host "  [TIP] Run debug script in browser console:" -ForegroundColor Cyan
Write-Host "     - Go to http://localhost:3000/ar-nav page" -ForegroundColor White
Write-Host "     - Open developer tools console (F12)" -ForegroundColor White
Write-Host "     - Run debugARNav() function" -ForegroundColor White
Write-Host ""

# ========================================
# Results Summary
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($result in $results) {
    $statusColor = switch ($result.Status) {
        "[OK] Normal" { "Green" }
        "[WARN] Abnormal" { "Yellow" }
        "[WARN] Skipped" { "Yellow" }
        "[WARN] Empty" { "Yellow" }
        "[WARN] Failed" { "Yellow" }
        default { "Red" }
    }
    Write-Host "$($result.Name): $($result.Status)" -ForegroundColor $statusColor
    if ($result.Details) {
        Write-Host "  └─ $($result.Details)" -ForegroundColor Gray
    }
}

$successCount = ($results | Where-Object { $_.Status -like "[OK]*" }).Count
$totalCount = $results.Count

Write-Host ""
Write-Host "Total $successCount/$totalCount items normal" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if there were API errors
$hasErrors = ($results | Where-Object { $_.Status -like "*ERROR*" }).Count -gt 0
if ($hasErrors) {
    Write-Host "[IMPORTANT] API errors detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Check database status:" -ForegroundColor Yellow
    Write-Host "   .\scripts\test.ps1" -ForegroundColor White
    Write-Host "   Select option 8 (Database status check)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. If database is not initialized, run:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   .\venv\Scripts\python.exe -m alembic upgrade head" -ForegroundColor White
    Write-Host "   .\venv\Scripts\python.exe app\database\seeds.py" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Check backend server logs for detailed error messages" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "4. Open http://localhost:3000/ar-nav in browser" -ForegroundColor White
Write-Host "5. Run debugARNav() in developer console" -ForegroundColor White
Write-Host "6. Check camera and GPS permissions" -ForegroundColor White
Write-Host ""
