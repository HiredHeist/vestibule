const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    title: 'VESTIBULE — A Doom Metal Deckbuilder',
    icon: path.join(__dirname, '..', 'public', 'vestibule', 'icon.png'),
    backgroundColor: '#040201',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  // Load the built Vite app
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false)

  // F11 fullscreen toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => { app.quit() })

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
