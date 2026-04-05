import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';
import { getCurrentRootFolder, openRootFolderDialog, resolveInitialRootFolder } from './services/projectService';

const isDev = !app.isPackaged;
const devServerUrl = 'http://127.0.0.1:5173';
let mainWindow: BrowserWindow | null = null;

function refreshWindowState(): void {
  if (!mainWindow) {
    return;
  }

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    return;
  }

  mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
}

async function handleOpenRootFolderFromMenu(): Promise<void> {
  const previousRootFolder = await getCurrentRootFolder();
  const nextAppState = await openRootFolderDialog();

  if (nextAppState.currentRootFolder !== previousRootFolder) {
    refreshWindowState();
  }
}

function createApplicationMenu(): void {
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            void handleOpenRootFolderFromMenu();
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createApplicationMenu();
  resolveInitialRootFolder()
    .catch(() => null)
    .finally(() => {
      createWindow();
    });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
