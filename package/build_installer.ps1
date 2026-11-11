# Script tự động hóa đóng gói bộ cài đặt Windows Kaola Office
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Split-Path -Parent $scriptDir
$issPath = Join-Path $scriptDir "kaola_setup.iss"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "         KAOLA OFFICE PACKAGER           " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Kiểm tra ISCC compiler
$isccPath = $null
$defaultPaths = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

foreach ($p in $defaultPaths) {
    if (Test-Path $p) {
        $isccPath = $p
        break
    }
}

if (-not $isccPath) {
    $cmd = Get-Command iscc -ErrorAction SilentlyContinue
    if ($cmd) {
        $isccPath = $cmd.Source
    }
}

if (-not $isccPath) {
    Write-Host "[WARNING] Chưa tìm thấy Inno Setup Compiler (ISCC.exe) trên máy." -ForegroundColor Yellow
    Write-Host "Bạn có thể cài đặt tự động bằng lệnh sau:" -ForegroundColor Yellow
    Write-Host "  winget install JRSoftware.InnoSetup -e" -ForegroundColor Green
    Write-Host "Hoặc tải từ: https://jrsoftware.org/isdl.php" -ForegroundColor White
    exit 1
}

Write-Host "[INFO] Tìm thấy Inno Setup tại: $isccPath" -ForegroundColor Green
Write-Host "[INFO] Đang đóng gói: $issPath..." -ForegroundColor Green

& "$isccPath" "$issPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Đóng gói thành công file cài đặt: package\Output\KaolaOffice_Setup.exe" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Đóng gói thất bại với mã lỗi $LASTEXITCODE" -ForegroundColor Red
}
