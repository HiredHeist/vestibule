const {app,BrowserWindow}=require('electron')
app.commandLine.appendSwitch('remote-debugging-port','9222')
app.commandLine.appendSwitch('no-sandbox')
const fs=require('fs')
app.whenReady().then(()=>{
  const w=new BrowserWindow({width:1920,height:1080,show:true,backgroundColor:'#040201',webPreferences:{nodeIntegration:false,contextIsolation:true}})
  w.webContents.on('console-message',(e,level,msg,line,src)=>{fs.appendFileSync('/tmp/game-console.log',`[${level}] ${msg} (${src}:${line})\n`)})
  w.loadURL('http://localhost:4173/vestibule/')
})
