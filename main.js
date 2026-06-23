const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;

let mainWindow = null;
let splashWindow = null;



function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    icon: path.join(__dirname, "build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#000000",
    title: "DATABEND - Experimental Audio Glitch & Wavelet Bender",
    fullscreen: true,
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
ipcMain.handle("open-file-dialog", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Audio Files",
          extensions: ["wav", "mp3", "ogg", "flac", "aac", "m4a", "mpeg"],
        },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const name = path.basename(filePath);
    const data = await fs.readFile(filePath);

    return {
      name,
      data: data.buffer,
    };
  } catch (error) {
    console.error("Error in open-file-dialog handler:", error);
    throw error;
  }
});

ipcMain.handle("save-file-dialog", async (event, arrayBuffer) => {
  try {
    const result = await dialog.showSaveDialog({
      title: "Export Audio File",
      defaultPath: `databend_export_${Date.now()}.wav`,
      filters: [{ name: "WAV Audio", extensions: ["wav"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, reason: "canceled" };
    }

    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(result.filePath, buffer);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error("Error in save-file-dialog handler:", error);
    return { success: false, reason: error.message };
  }
});

ipcMain.handle("select-sample-folder", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const dirPath = result.filePaths[0];
    const files = await fs.readdir(dirPath);
    const audioFiles = [];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if ([".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a", ".mpeg"].includes(ext)) {
        audioFiles.push({
          name: file,
          path: path.join(dirPath, file)
        });
      }
    }
    return {
      folderName: path.basename(dirPath),
      files: audioFiles,
      dirPath: dirPath
    };
  } catch (error) {
    console.error("Error in select-sample-folder handler:", error);
    throw error;
  }
});

ipcMain.handle("read-sample-folder", async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const audioFiles = [];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if ([".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a", ".mpeg"].includes(ext)) {
        audioFiles.push({
          name: file,
          path: path.join(dirPath, file)
        });
      }
    }
    return {
      folderName: path.basename(dirPath),
      files: audioFiles
    };
  } catch (error) {
    console.error("Error in read-sample-folder handler:", error);
    throw error;
  }
});

ipcMain.handle("load-sample-file", async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath);
    return data.buffer;
  } catch (error) {
    console.error("Error in load-sample-file handler:", error);
    throw error;
  }
});

const os = require("os");

ipcMain.handle("select-export-directory", async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: "Select Kit Export Folder",
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (error) {
    console.error("Error in select-export-directory:", error);
    throw error;
  }
});

ipcMain.handle("save-kit-files", async (event, dirPath, filesArray) => {
  try {
    for (const file of filesArray) {
      const buffer = Buffer.from(file.data);
      const filePath = path.join(dirPath, file.name);
      await fs.writeFile(filePath, buffer);
    }
    return { success: true };
  } catch (error) {
    console.error("Error in save-kit-files:", error);
    return { success: false, reason: error.message };
  }
});

ipcMain.handle("save-temp-drag-file", async (event, arrayBuffer, fileName) => {
  try {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  } catch (error) {
    console.error("Error in save-temp-drag-file:", error);
    throw error;
  }
});

const { nativeImage } = require("electron");

ipcMain.on("start-drag", (event, filePath) => {
  let icon = nativeImage.createFromPath(path.join(__dirname, "build/icon.png"));
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 64, height: 64 });
  }
  event.sender.startDrag({
    file: filePath,
    icon: icon
  });
});

const { exec } = require("child_process");


