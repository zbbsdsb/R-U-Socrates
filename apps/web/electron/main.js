/**
 * R U Socrates — Electron Main Process
 *
 * Desktop app shell:
 *  1. Serves the built Next.js static app (out/) via a local HTTP server
 *  2. Starts the FastAPI backend as a subprocess (services/api/main:app)
 *  3. Both run on localhost; the renderer just calls /api/* as normal
 */

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development";

const FRONTEND_PORT = 3000;
const BACKEND_PORT  = 8000;

let mainWindow  = null;
let backendProc = null;
let httpServer  = null;

// ─── Static file server for the Next.js export ───────────────────────────────
function serveStatic(dir, port) {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js":   "application/javascript",
    ".mjs":  "application/javascript",
    ".css":  "text/css",
    ".json": "application/json",
    ".png":  "image/png",
    ".ico":  "image/x-icon",
    ".svg":  "image/svg+xml",
    ".woff2":"font/woff2",
    ".woff": "font/woff",
    ".ttf":  "font/ttf",
  };

  return new Promise((resolve, reject) => {
    httpServer = http.createServer((req, res) => {
      // Rewrite / → /index.html (SPA routing)
      let filePath = path.join(dir, req.url === "/" ? "index.html" : req.url);
      filePath = filePath.split("?")[0];

      // Fallback: if exact file not found, try index.html in that "directory"
      if (!fs.existsSync(filePath)) {
        const dirIndex = path.join(path.dirname(filePath), "index.html");
        if (fs.existsSync(dirIndex)) filePath = dirIndex;
      }

      const ext  = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || "application/octet-stream";

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: always serve index.html
          const index = path.join(dir, "index.html");
          fs.readFile(index, (_, d) => {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(d || "Not found");
          });
        } else {
          res.writeHead(200, { "Content-Type": mime });
          res.end(data);
        }
      });
    });

    httpServer.on("error", reject);
    httpServer.listen(port, "127.0.0.1", () => {
      console.log(`[Static] HTTP server listening on http://localhost:${port}`);
      resolve();
    });
  });
}

// ─── Start FastAPI backend subprocess ─────────────────────────────────────────
function startBackend() {
  return new Promise((resolve) => {
    const python = process.platform === "win32" ? "python" : "python3";
    backendProc = spawn(python, [
      "-m", "uvicorn",
      "services.api.main:app",
      "--host", "127.0.0.1",
      "--port", String(BACKEND_PORT),
    ], {
      cwd:   path.join(__dirname, "..", "..", "..", ".."),
      stdio: ["ignore", "pipe", "pipe"],
      env:   { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    backendProc.stdout.on("data", (d) => {
      const line = d.toString().trim();
      process.stdout.write(`[Backend] ${line}\n`);
      if (line.includes("Uvicorn running") || line.includes("Application startup complete")) {
        resolve();
      }
    });

    backendProc.stderr.on("data", (d) => {
      process.stderr.write(`[Backend ERR] ${d.toString().trim()}\n`);
    });

    backendProc.on("error", (err) => {
      console.error("[Backend] Failed to start:", err.message);
      resolve();
    });

    setTimeout(resolve, 8000);
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
      preload:            path.join(__dirname, "preload.js"),
      contextIsolation:    true,
      nodeIntegration:     false,
      sandbox:             false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
  }

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (!isDev) {
    const staticDir = path.join(__dirname, "..", "out");
    await Promise.all([
      serveStatic(staticDir, FRONTEND_PORT),
      startBackend(),
    ]);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (backendProc) backendProc.kill();
  if (httpServer)  httpServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backendProc) backendProc.kill();
  if (httpServer)  httpServer.close();
});

ipcMain.on("minimize", () => mainWindow?.minimize());
ipcMain.on("maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("close",    () => mainWindow?.close());
