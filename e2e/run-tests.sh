#!/usr/bin/env bash
# Linux/cloud twin of e2e/run-tests.bat — same five gates, same verdict.
cd "$(dirname "$0")/.." || exit 1
FAILED=0
echo "================================================================"
echo " VESTIBULE TEST SUITE"
echo "================================================================"
echo; echo "[1/5] Building game..."
npx vite build >/dev/null 2>&1 && echo "   PASS - build clean" || { echo "   FAIL - build error"; FAILED=1; }
echo; echo "[2/5] Design rules lint..."
npm run check >/dev/null 2>&1 && echo "   PASS - all rules clean" || { echo "   FAIL - run: npm run check"; FAILED=1; }
echo; echo "[3/5] Card engine self-test (86 cards, determinism, invariants)..."
node src/data/cardEngine.js | tail -1 && [ "${PIPESTATUS[0]}" = "0" ] || { FAILED=1; }
echo; echo "[4/5] Simulator (2000 games)..."
if node vestibule-sim-kwstacks.js 2000 > /tmp/vst_sim.txt 2>&1; then
  echo "   PASS - sim completed"; grep -E "Lucifer wins:|Circle 1:" /tmp/vst_sim.txt | head -2
else echo "   FAIL - sim crashed"; FAILED=1; fi
echo; echo "[5/5] LIVE tests - booting the game rig..."
bash e2e/up.sh >/dev/null 2>&1; sleep 5
echo "   - bot perception (33 assertions vs a planted live board)..."
node e2e/test-perception.cjs 2>&1 | tail -1; [ "${PIPESTATUS[0]}" = "0" ] || FAILED=1
echo "   - card parity (every card played in the REAL game vs the engine)..."
node e2e/test-card-parity.cjs 2>&1 | tail -1; [ "${PIPESTATUS[0]}" = "0" ] || FAILED=1
echo; echo "================================================================"
[ "$FAILED" = "1" ] && echo " RESULT: FAILURES ABOVE - do NOT trust overnight data yet" || echo " RESULT: ALL GREEN - safe to run the bot overnight"
echo "================================================================"
exit $FAILED
