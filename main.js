const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const ASSETS_DIR = path.join(__dirname, 'assets', 'images')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#F5F5F7',
      symbolColor: '#1D1D1F',
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile(path.join(__dirname, 'src', 'index.html'))
}

/* ── IPC: 保存图片 ── */

ipcMain.handle('save-image', async (_event, dataUrl) => {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) return null

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filepath = path.join(ASSETS_DIR, filename)

  fs.mkdirSync(ASSETS_DIR, { recursive: true })
  fs.writeFileSync(filepath, buffer)
  return filepath
})

/* ── IPC: 选择图片文件 ── */

ipcMain.handle('open-image-dialog', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }]
  })

  if (result.canceled) return null
  return result.filePaths
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
