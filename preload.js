const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Image
  saveImage: (dataUrl) => ipcRenderer.invoke('save-image', dataUrl),
  openImageDialog: () => ipcRenderer.invoke('open-image-dialog'),

  // File operations
  newFile: () => ipcRenderer.invoke('file-new'),
  openFile: () => ipcRenderer.invoke('file-open'),
  saveFile: (content, filepath) => ipcRenderer.invoke('file-save', content, filepath),
  saveFileAs: (content) => ipcRenderer.invoke('file-save-as', content)
})
