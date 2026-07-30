@echo off
REM ── VESTIBULE OVERNIGHT BOT — Windows launcher ──
REM One-time setup (in repo root):  npm install  &&  npm run build  &&  set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1&& npm i -D playwright-core
REM Then double-click this file. Game window appears; bot plays it. Close this console to stop.
cd /d "%~dp0\.."
REM reuse an already-running preview server if one exists (leftover from a prior launch)
curl -s -m 2 -o nul http://localhost:4173/vestibule/ && goto :served
start "vite" /b cmd /c "npx vite preview --port 4173 --strictPort"
timeout /t 4 /nobreak >nul
:served
start "electron" .\node_modules\.bin\electron.cmd .\e2e\driver.cjs
timeout /t 6 /nobreak >nul
node e2e\autopilot.cjs 480
pause
