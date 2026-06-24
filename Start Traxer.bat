@echo off
setlocal

set "APP_DIR=%~dp0"
set "TRAXER_URL=http://127.0.0.1:5173/"

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ^
  "$port = 5173; " ^
  "$running = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; " ^
  "if (-not $running) { Start-Process -FilePath 'python' -ArgumentList '-m','http.server','5173','--bind','127.0.0.1' -WorkingDirectory '%APP_DIR%' -WindowStyle Hidden }; " ^
  "Start-Sleep -Milliseconds 700; " ^
  "Start-Process '%TRAXER_URL%'"

endlocal
