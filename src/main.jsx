import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ═══ CRT SCANLINES + VHS EFFECT ═══
// Runs outside React — position:fixed overlays on document.body
// Polls localStorage every 400ms for toggle responsiveness
if (!window.__vstOverlayInit) {
  window.__vstOverlayInit = true
  function vstUpdateOverlays() {
    const scanOn = localStorage.getItem('vst_scanlines') !== 'off'
    const vhsOn = localStorage.getItem('vst_vhs') !== 'off'
    // SCANLINES
    let s = document.getElementById('vst-crt')
    if (scanOn && !s) {
      s = document.createElement('div'); s.id = 'vst-crt'
      s.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99990;background-image:repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px);background-size:100% 4px;'
      document.body.appendChild(s)
    } else if (!scanOn && s) { s.remove() }
    // VHS
    let v = document.getElementById('vst-vfx')
    if (vhsOn && !v) {
      v = document.createElement('div'); v.id = 'vst-vfx'
      v.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99991;'
      v.innerHTML = '<div style="position:absolute;inset:0;box-shadow:inset 12px 0 rgba(255,0,0,.25),inset -12px 0 rgba(0,100,255,.25)"></div>'
        + '<div style="position:absolute;inset:0;animation:vhsFlicker .15s infinite;background:rgba(0,0,0,.06)"></div>'
        + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.7) 100%)"></div>'
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
