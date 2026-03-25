import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ═══ CRT SCANLINES + VHS EFFECT ═══
// Runs outside React — position:fixed overlays on document.body
// Polls localStorage every 400ms for toggle responsiveness
if (!window.__vstOverlayInit) {
  window.__vstOverlayInit = true
  // Inject VHS CSS animations
  const vstCSS = document.createElement('style')
  vstCSS.textContent = `
    @keyframes vhsJitter {
      0%,100% { transform: translateY(0); }
      10%     { transform: translateY(1.5px); }
      20%     { transform: translateY(-1px); }
      30%     { transform: translateY(1.2px); }
      50%     { transform: translateY(-1.5px); }
      70%     { transform: translateY(1px); }
      80%     { transform: translateY(-1.2px); }
      90%     { transform: translateY(1.5px); }
    }
    @keyframes vhsFlickerStrong {
      0%   { opacity: 1; }
      3%   { opacity: 0.94; }
      6%   { opacity: 1; }
      50%  { opacity: 1; }
      52%  { opacity: 0.92; }
      55%  { opacity: 1; }
      80%  { opacity: 0.96; }
      82%  { opacity: 1; }
    }
  `
  document.head.appendChild(vstCSS)
  function vstUpdateOverlays() {
    const scanOn = localStorage.getItem('vst_scanlines') !== 'off'
    const vhsOn = localStorage.getItem('vst_vhs') !== 'off'
    // SCANLINES
    let s = document.getElementById('vst-crt')
    if (scanOn && !s) {
      s = document.createElement('div'); s.id = 'vst-crt'
      s.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99990;background-image:repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);background-size:100% 4px;'
      document.body.appendChild(s)
    } else if (!scanOn && s) { s.remove() }
    // VHS — jitter + vignette + flicker, no lines, no chroma
    let v = document.getElementById('vst-vfx')
    if (vhsOn && !v) {
      v = document.createElement('div'); v.id = 'vst-vfx'
      v.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99991;animation:vhsJitter 0.4s linear infinite;'
      v.innerHTML = '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.30) 100%);"></div>'
        + '<div style="position:absolute;inset:0;animation:vhsFlickerStrong 0.2s steps(3) infinite;background:rgba(0,0,0,0.01);"></div>'
      document.body.appendChild(v)
    } else if (!vhsOn && v) { v.remove() }
  }
  vstUpdateOverlays()
  setInterval(vstUpdateOverlays, 400)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
