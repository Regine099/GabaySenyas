# GabaySenyas ML setup (Windows PowerShell).
# Creates ml/.venv and installs everything needed to record, train, and run the live demo.
# Safe to run again: it reuses the existing venv and only installs what is missing.
#
#   powershell -ExecutionPolicy Bypass -File ml\setup.ps1
#
# Then activate the venv in each new terminal:
#   ml\.venv\Scripts\activate

$ErrorActionPreference = "Stop"
$ml   = $PSScriptRoot
$root = Split-Path $ml -Parent
$venv = Join-Path $ml ".venv"
$py   = Join-Path $venv "Scripts\python.exe"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python was not found. Install Python 3.10-3.12 from python.org (tick 'Add to PATH') and run this again."
}

if (-not (Test-Path $py)) {
    Write-Host "Creating virtual environment in ml\.venv ..."
    python -m venv $venv
    if ($LASTEXITCODE -ne 0) { throw "Failed to create the virtual environment." }
} else {
    Write-Host "Using existing ml\.venv"
}

function Invoke-Pip([string[]]$pipArgs) {
    & $py -m pip @pipArgs
    if ($LASTEXITCODE -ne 0) { throw "pip $($pipArgs -join ' ') failed." }
}

Write-Host "Upgrading pip ..."
Invoke-Pip @("install", "--upgrade", "pip")

Write-Host "Installing CPU-only PyTorch (avoids the large CUDA build) ..."
Invoke-Pip @("install", "torch", "--index-url", "https://download.pytorch.org/whl/cpu")

Write-Host "Installing ML and backend requirements ..."
Invoke-Pip @("install", "-r", (Join-Path $ml "requirements.txt"), "-r", (Join-Path $root "backend\requirements.txt"))

New-Item -ItemType Directory -Force (Join-Path $ml "data\landmarks") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $ml "models") | Out-Null

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  ml\.venv\Scripts\activate"
Write-Host "  python ml/training/webcam.py record --label A --signer S01"
Write-Host "(The MediaPipe hand model downloads automatically on the first run.)"
