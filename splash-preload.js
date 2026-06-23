const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronSplash", {
  done: () => ipcRenderer.send("splash-done"),
});
