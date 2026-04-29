/**
 * R U Socrates — Electron Preload Script
 * Exposes safe IPC bridge to the renderer process.
 */

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
