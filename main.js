const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const ASSETS_DIR = path.join(__dirname, 'assets', 'images')
const CSS_PATH = path.join(__dirname, 'src', 'styles', 'main.css')

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

/* ── IPC: 新建文件 ── */

ipcMain.handle('file-new', () => {
  return { content: '', filepath: null }
})

/* ── IPC: 打开文件 ── */

ipcMain.handle('file-open', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'txt'] }]
  })

  if (result.canceled) return null

  const filepath = result.filePaths[0]
  const content = fs.readFileSync(filepath, 'utf-8')
  return { content, filepath }
})

/* ── IPC: 保存文件 ── */

ipcMain.handle('file-save', async (_event, content, filepath) => {
  if (!filepath) {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: '未命名文档.md'
    })

    if (result.canceled) return null
    filepath = result.filePath
  }

  fs.writeFileSync(filepath, content, 'utf-8')
  return filepath
})

/* ── IPC: 另存为 ── */

ipcMain.handle('file-save-as', async (_event, content) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showSaveDialog(win, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: '未命名文档.md'
  })

  if (result.canceled) return null

  fs.writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
})

/* ── IPC: 导出 HTML ── */

ipcMain.handle('export-html', async (_event, htmlContent) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return false

  const result = await dialog.showSaveDialog(win, {
    filters: [{ name: 'HTML', extensions: ['html'] }],
    defaultPath: 'export.html'
  })

  if (result.canceled) return false

  fs.writeFileSync(result.filePath, htmlContent, 'utf-8')
  return true
})

/* ── IPC: 导出 PDF ── */

ipcMain.handle('export-pdf', async (_event, htmlContent) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return false

  const result = await dialog.showSaveDialog(win, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: 'export.pdf'
  })

  if (result.canceled) return false

  const pdfWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  })

  pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

  await new Promise(r => pdfWin.webContents.on('did-finish-load', r))
  await new Promise(r => setTimeout(r, 500))

  const pdfData = await pdfWin.webContents.printToPDF({
    printBackground: true,
    margin: { top: 20, bottom: 20, left: 20, right: 20 },
    pageSize: 'A4'
  })

  pdfWin.close()

  fs.writeFileSync(result.filePath, pdfData)
  return true
})

/* ── IPC: 窗口控制 ── */

ipcMain.on('window-minimize', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize()
})

ipcMain.on('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize()
})

ipcMain.on('window-close', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
