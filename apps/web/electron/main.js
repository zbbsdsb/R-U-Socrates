/**
 * R U Socrates — Electron Main Process
 *
 * Desktop app shell:
 *  1. Starts the FastAPI backend as a subprocess (services/api/main:app)
 *  2. Starts the Next.js dev server as a subprocess (apps/web)
 *  3. Opens the app window pointing at localhost:3000
 */

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const NEXT_PORT = 3000;
const BACKEND_PORT = 8000;

let mainWindow = null;
let backendProc = null;
let nextProc = null;

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
      // Next.js is ready when it prints "Ready in"
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

    // Timeout fallback — proceed after 30s even if ready msg not seen
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
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log("[App] Starting R U Socrates…");

  // Start backend first (no deps)
  startBackend();

  // Start Next.js and wait for it to be ready
  await startNext();

  // Open the window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextProc)    nextProc.kill();
  if (backendProc) backendProc.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProc)    nextProc.kill();
  if (backendProc) backendProc.kill();
});

ipcMain.on("minimize", () => mainWindow?.minimize());
ipcMain.on("maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("close", () => mainWindow?.close());
