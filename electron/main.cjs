const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const http = require('http');

let islandWindow = null;
let controllerWindow = null;

const DEV_URL = 'http://127.0.0.1:5173';

function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(DEV_URL, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function loadWindow(win, viewName) {
  const isServerUp = await checkDevServer();
  if (isServerUp) {
    win.loadURL(`${DEV_URL}?view=${viewName}`);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { view: viewName }
    });
  }
}

async function createIslandWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workArea;

  const initialWidth = 140;
  const initialHeight = 24;
  const initialX = Math.round((screenWidth - initialWidth) / 2);

  islandWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  islandWindow.setAlwaysOnTop(true, 'screen-saver');
  islandWindow.setVisibleOnAllWorkspaces?.(true);

  await loadWindow(islandWindow, 'island');

  islandWindow.on('closed', () => {
    islandWindow = null;
  });
}

async function createControllerWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workArea;

  controllerWindow = new BrowserWindow({
    width: 440,
    height: Math.min(760, screenHeight - 60),
    x: Math.max(20, screenWidth - 480),
    y: 60,
    title: 'Gemini CLI Island - Painel de Controle',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await loadWindow(controllerWindow, 'controller');

  controllerWindow.on('closed', () => {
    controllerWindow = null;
    // If controller is closed, close the island too
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.close();
    }
  });
}

app.whenReady().then(async () => {
  await createIslandWindow();
  await createControllerWindow();

  // IPC: Dynamic resizing of the Island window
  ipcMain.on('island:resize', (_event, { width, height }) => {
    if (islandWindow && !islandWindow.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth } = primaryDisplay.workArea;

      // Minimum padding to avoid clipping CSS shadows
      const paddedWidth = Math.max(120, Math.round(width + 24));
      const paddedHeight = Math.max(16, Math.round(height + 12));
      const x = Math.round((screenWidth - paddedWidth) / 2);

      islandWindow.setBounds({
        x,
        y: 0,
        width: paddedWidth,
        height: paddedHeight
      });
    }
  });

  // IPC: Agent actions from controller to island
  ipcMain.on('agent:action', (_event, data) => {
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('agent:action', data);
    }
  });

  // IPC: Full state sync
  ipcMain.on('agent:sync-state', (event, data) => {
    if (event.sender === controllerWindow?.webContents) {
      if (islandWindow && !islandWindow.isDestroyed()) {
        islandWindow.webContents.send('agent:sync-state', data);
      }
    } else {
      if (controllerWindow && !controllerWindow.isDestroyed()) {
        controllerWindow.webContents.send('agent:sync-state', data);
      }
    }
  });

  // IPC: Permission responses from island to controller
  ipcMain.on('permission:response', (_event, approved) => {
    if (controllerWindow && !controllerWindow.isDestroyed()) {
      controllerWindow.webContents.send('permission:response', approved);
    }
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createIslandWindow();
      await createControllerWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
