@echo off
setlocal enabledelayedexpansion
REM ── VESTIBULE — RUN EVERY TEST ──
REM Double-click, or:  e2e\run-tests.bat
REM Takes ~5 minutes. Boots the game rig, runs all five gates, prints one verdict.
cd /d "%~dp0\.."
set FAILED=0

echo.
echo ================================================================
echo  VESTIBULE TEST SUITE
echo ================================================================

echo.
echo [1/5] Building game...
call npx vite build >nul 2>&1
if errorlevel 1 (echo    FAIL - build error & set FAILED=1) else (echo    PASS - build clean)

echo.
echo [2/5] Design rules lint...
call npm run check >nul 2>&1
if errorlevel 1 (echo    FAIL - lint violations, run: npm run check & set FAILED=1) else (echo    PASS - all rules clean)

echo.
echo [3/5] Card engine self-test ^(86 cards, determinism, invariants^)...
node src\data\cardEngine.js
if errorlevel 1 (echo    FAIL & set FAILED=1) else (echo    PASS)

echo.
echo [4/5] Simulator ^(2000 games, must complete without error^)...
node vestibule-sim-kwstacks.js 2000 > "%TEMP%\vst_sim.txt" 2>&1
if errorlevel 1 (echo    FAIL - sim crashed, see %TEMP%\vst_sim.txt & set FAILED=1) else (
  echo    PASS - sim completed
  findstr /C:"Lucifer wins:" "%TEMP%\vst_sim.txt"
  findstr /C:"Circle 1:" "%TEMP%\vst_sim.txt"
)

echo.
echo [5/5] LIVE tests - booting the game rig...
curl -s -m 2 -o nul http://localhost:4173/vestibule/ || start "vite" /b cmd /c "npx vite preview --port 4173 --strictPort"
timeout /t 4 /nobreak >nul
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul
start "electron" .\node_modules\.bin\electron.cmd .\e2e\driver.cjs
timeout /t 7 /nobreak >nul

echo    - bot perception ^(33 assertions vs a planted live board^)...
node e2e\test-perception.cjs
if errorlevel 1 (echo    FAIL & set FAILED=1) else (echo    PASS)

echo    - card parity ^(every card played in the REAL game vs the engine^)...
node e2e\test-card-parity.cjs
if errorlevel 1 (echo    FAIL - sim and game have DRIFTED & set FAILED=1) else (echo    PASS)

echo.
echo ================================================================
if "%FAILED%"=="1" (
  echo  RESULT: FAILURES ABOVE - do NOT trust overnight data yet
) else (
  echo  RESULT: ALL GREEN - safe to run e2e\run-bot.bat overnight
)
echo ================================================================
echo.
pause
