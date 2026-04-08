import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  type MenuItemConstructorOptions
} from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';
import type { MenuAction } from '../src/shared/api/requester';
import { resolveInitialRootFolder } from './services/projectService';
import {
  clearWindowState,
  getWindowHasDirtyTabs
} from './services/windowStateService';

const devServerUrl = process.env.REQUESTER_DEV_SERVER_URL?.trim();
const isDev = !app.isPackaged && Boolean(devServerUrl);
let mainWindow: BrowserWindow | null = null;
let allowWindowClose = false;

function dispatchMenuAction(action: MenuAction): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('menu:action', action);
}

function createApplicationMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: () => dispatchMenuAction('open-folder')
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => dispatchMenuAction('save-active-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => dispatchMenuAction('close-active-tab')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Request',
      submenu: [
        {
          label: 'Send',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => dispatchMenuAction('send-active-tab')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}

async function confirmWindowCloseWithDirtyTabs(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Quit without saving', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes.',
    detail: 'Quit without saving your changes?'
  });

  if (result.response === 0) {
    allowWindowClose = true;
    mainWindow.close();
  }
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

  if (isDev && devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!mainWindow || allowWindowClose) {
      return;
    }

    const hasDirtyTabs = getWindowHasDirtyTabs(mainWindow.webContents.id);
    if (!hasDirtyTabs) {
      return;
    }

    event.preventDefault();
    void confirmWindowCloseWithDirtyTabs();
  });

  mainWindow.on('closed', () => {
    if (mainWindow) {
      clearWindowState(mainWindow.webContents.id);
    }
    mainWindow = null;
    allowWindowClose = false;
  });
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
