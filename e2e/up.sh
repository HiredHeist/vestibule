#!/bin/bash
if ! curl -s -m 1 http://localhost:9222/json/version > /dev/null 2>&1; then
  pkill -f "electron.*e2e/driver" 2>/dev/null; pkill Xvfb 2>/dev/null; sleep 1
  cd /home/claude/vestibule
  if ! curl -s -m 1 -o /dev/null http://localhost:4173/vestibule/; then nohup npx vite preview --port 4173 --strictPort > /tmp/preview.log 2>&1 & sleep 2; fi
  setsid nohup xvfb-run -a --server-args="-screen 0 1920x1080x24" ./node_modules/.bin/electron ./e2e/driver.cjs --no-sandbox > /tmp/electron.log 2>&1 < /dev/null &
  for i in $(seq 1 20); do curl -s -m 1 http://localhost:9222/json/version >/dev/null 2>&1 && break; sleep 1; done
  sleep 3
fi
if [ "$(curl -s -m 1 -o /dev/null -w "%{http_code}" http://localhost:4173/vestibule/)" != "200" ]; then cd /home/claude/vestibule && setsid nohup npx vite preview --port 4173 --strictPort > /tmp/preview.log 2>&1 < /dev/null & sleep 3; fi
node e2e/eval.cjs "if(location.href.indexOf('4173')<0||document.title.indexOf('refused')>=0||!document.body.textContent.trim()){location.href='http://localhost:4173/vestibule/'}" >/dev/null 2>&1; sleep 1
