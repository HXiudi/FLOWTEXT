const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  newFile: () => ipcRenderer.invoke('file-new'),
  openFile: () => ipcRenderer.invoke('file-open'),
  saveFile: (content, filepath) => ipcRenderer.invoke('file-save', content, filepath),
  saveFileAs: (content) => ipcRenderer.invoke('file-save-as', content),

  exportHtml: (content) => ipcRenderer.invoke('export-html', content),
  exportPdf: (content) => ipcRenderer.invoke('export-pdf', content)
})
