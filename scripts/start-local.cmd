@echo off
title SC1986 localhost:3000
cd /d "%~dp0.."
echo Starting SC1986 website...
echo Keep this window open while using http://localhost:3000/
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000/'"
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev -p 3000
echo.
echo The website has stopped.
pause
