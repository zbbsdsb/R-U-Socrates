const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");

const NEXT_PORT = 3000;
const BACKEND_PORT = 8000;

let mainWindow = null;
let tray = null;
let backendProc = null;
let nextProc = null;

// ─── System Tray ───────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, "..", "build", "icon.png");
  
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    }},
    { label: "Check for Updates", click: () => autoUpdater.checkForUpdatesAndNotify() },
    { type: "separator" },
    { label: "Quit", click: () => {
      if (nextProc) nextProc.kill();
      if (backendProc) backendProc.kill();
      app.quit();
    }}
  ]);

  tray.setToolTip("R U Socrates");
  tray.setContextMenu(contextMenu);
  
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Auto Updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", "Checking for updates...");
    }
  });

  autoUpdater.on("update-available", () => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", "Update available, downloading...");
    }
  });

  autoUpdater.on("update-not-available", () => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", "No updates available");
    }
  });

  autoUpdater.on("error", (err) => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", `Update error: ${err.message}`);
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    if (mainWindow) {
      mainWindow.webContents.send("update-status", message);
    }
  });

  autoUpdater.on("update-downloaded", () => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", "Update downloaded, restart to install");
    }
  });
}

// ─── Start Next.js dev server ────────────────────────────────────────────────
function startNext() {
  return new Promise((resolve) => {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const cwd = path.join(__dirname, "..");

    nextProc = spawn(npm, ["run", "dev", "--", "-p", String(NEXT_PORT)], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    nextProc.stdout.on("data", (d) => {
      const line = d.toString().trim();
      process.stdout.write(`[Next] ${line}\n`);
      if (line.includes("Ready in") || line.includes("compiled")) {
        resolve();
      }
    });

    nextProc.stderr.on("data", (d) => {
      process.stderr.write(`[Next ERR] ${d.toString().trim()}\n`);
    });

    nextProc.on("error", (err) => {
      console.error("[Next] Failed to start:", err.message);
      resolve();
    });

    setTimeout(resolve, 30000);
  });
}

// ─── Start FastAPI backend ────────────────────────────────────────────────────
function startBackend() {
  const python = process.platform === "win32" ? "python" : "python3";
  backendProc = spawn(python, [
    "-m", "uvicorn",
    "services.api.main:app",
    "--host", "127.0.0.1",
    "--port", String(BACKEND_PORT),
  ], {
    cwd: path.join(__dirname, "..", "..", ".."),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  backendProc.stdout.on("data", (d) => {
    const line = d.toString().trim();
    process.stdout.write(`[Backend] ${line}\n`);
  });

  backendProc.stderr.on("data", (d) => {
    process.stderr.write(`[Backend ERR] ${d.toString().trim()}\n`);
  });

  backendProc.on("error", (err) => {
    console.error("[Backend] Failed to start:", err.message);
  });
}

// ─── Browser window ───────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "R U Socrates",
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  
  mainWindow.on("minimize", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log("[App] Starting R U Socrates…");

  createTray();
  setupAutoUpdater();
  
  startBackend();
  await startNext();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
  if (nextProc) nextProc.kill();
  if (backendProc) backendProc.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProc) nextProc.kill();
  if (backendProc) backendProc.kill();
});

ipcMain.on("minimize", () => mainWindow?.hide());
ipcMain.on("maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("close", () => mainWindow?.close());
ipcMain.on("check-for-updates", () => autoUpdater.checkForUpdatesAndNotify());
