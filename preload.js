const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveFileDialog: (arrayBuffer) => ipcRenderer.invoke("save-file-dialog", arrayBuffer),
  selectSampleFolder: () => ipcRenderer.invoke("select-sample-folder"),
  loadSampleFile: (filePath) => ipcRenderer.invoke("load-sample-file", filePath),
  readSampleFolder: (dirPath) => ipcRenderer.invoke("read-sample-folder", dirPath),
  selectExportDirectory: () => ipcRenderer.invoke("select-export-directory"),
  saveKitFiles: (dirPath, filesArray) => ipcRenderer.invoke("save-kit-files", dirPath, filesArray),
  saveTempDragFile: (arrayBuffer, fileName) => ipcRenderer.invoke("save-temp-drag-file", arrayBuffer, fileName),
  startDrag: (filePath) => ipcRenderer.send("start-drag", filePath)
});
