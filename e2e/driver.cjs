const {app,BrowserWindow}=require('electron')
app.commandLine.appendSwitch('remote-debugging-port','9222')
app.commandLine.appendSwitch('no-sandbox')
// Belt-and-braces mute: kills audio at the Chromium layer before a single
// buffer is decoded, so nothing slips through during page load.
app.commandLine.appendSwitch('mute-audio')
const fs=require('fs')
const os=require('os')
const path=require('path')
const LOGF=path.join(os.tmpdir(),'game-console.log')
// Bot runs are SILENT by default — the rig replays the same fight hundreds of
// times and the SFX are unbearable. Set VST_AUDIO=1 to hear it (only useful
// when debugging an audio-triggered bug).
const MUTED=process.env.VST_AUDIO!=='1'
app.whenReady().then(()=>{
  const w=new BrowserWindow({width:1920,height:1080,show:true,backgroundColor:'#040201',webPreferences:{nodeIntegration:false,contextIsolation:true}})
  w.webContents.on('console-message',(e,level,msg,line,src)=>{try{fs.appendFileSync(LOGF,`[${level}] ${msg} (${src}:${line})\n`)}catch(e){}})
  if(MUTED){
    const silence=()=>{
      try{
        w.webContents.setAudioMuted(true)
        // The game's SFX are generated with AudioContext oscillators rather
        // than <audio> elements, and those are not reliably covered by
        // setAudioMuted on every Electron build — so zero the volume keys the
        // game reads on mount as well.
        w.webContents.executeJavaScript(
          "try{localStorage.setItem('vst_music_vol','0');localStorage.setItem('vst_sfx_vol','0')}catch(e){}",
          true
        ).catch(()=>{})
      }catch(e){}
    }
    silence()
    // Re-applied on every load: the card-parity harness reloads the page once
    // per scenario (105 times), and a fresh document resets the AudioContext.
    w.webContents.on('dom-ready',silence)
    w.webContents.on('did-finish-load',silence)
    w.webContents.on('did-navigate',silence)
  }
  w.loadURL('http://localhost:4173/vestibule/')
})
