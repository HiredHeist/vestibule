@echo off
setlocal enabledelayedexpansion
REM ── VESTIBULE OVERNIGHT BOT — Windows launcher ──
REM One-time setup (in repo root):  npm install  &&  npm run build  &&  set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1&& npm i -D playwright-core
REM Then double-click this file. Game window appears; bot plays it. Close this console to stop.
REM
REM Aug 1 2026 — SUPERVISOR LOOP. The bot's hard watchdog exits with code 3 when the
REM rig itself is wedged (dead Electron / dead CDP), which no in-process recovery can
REM fix. Previously that ended the night. This loop relaunches a FRESH browser and
REM keeps grinding until the total budget is spent, so an unattended overnight run
REM can survive a crashed renderer.
cd /d "%~dp0\.."

REM rebuild the game so dist ALWAYS matches the pulled source (stale-dist trap killer)
echo Building latest game version...
call npx vite build

REM total wall-clock budget for the night, in minutes
set TOTAL_MINUTES=480
set /a REMAINING=%TOTAL_MINUTES%
set ATTEMPT=0

:launch
if %REMAINING% LEQ 0 goto :done
set /a ATTEMPT+=1
echo.
echo ==== VESTIBULE BOT — segment %ATTEMPT%, %REMAINING% minutes remaining ====

REM reuse an already-running preview server if one exists (leftover from a prior launch)
curl -s -m 2 -o nul http://localhost:4173/vestibule/ && goto :served
start "vite" /b cmd /c "npx vite preview --port 4173 --strictPort"
timeout /t 4 /nobreak >nul
:served

REM ensure no orphaned Electron from a wedged segment is still holding the CDP port
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
start "electron" .\node_modules\.bin\electron.cmd .\e2e\driver.cjs
timeout /t 6 /nobreak >nul

node e2e\autopilot.cjs %REMAINING%
set EXITCODE=%ERRORLEVEL%

if %EXITCODE% EQU 3 (
  echo Bot exited with code 3 ^(rig wedged^) — relaunching with a fresh browser...
  REM assume the wedged segment burned ~2 minutes before giving up
  set /a REMAINING-=2
  goto :launch
)

:done
echo.
echo ==== BOT RUN COMPLETE — ledger: e2e\session3-events.jsonl ====
pause
