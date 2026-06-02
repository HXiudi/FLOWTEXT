const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  saveImage: (dataUrl) => ipcRenderer.invoke('save-image', dataUrl),
  openImageDialog: () => ipcRenderer.invoke('open-image-dialog')
})
