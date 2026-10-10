// electron-main.cjs
// Script principal para ejecutar Innova Contratistas con Electron en Windows, Mac o Linux.

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Reemplaza esta URL con la URL de tu app desplegada o mantén localhost si corres el servidor local
const APP_URL = process.env.APP_URL || 'https://ais-pre-nwhenqc5mdh4oi4yn7mjam-801397840243.us-east1.run.app';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Innova Contratistas - Estructuras Metálicas y Finanzas',
    icon: path.join(__dirname, 'public/pwa-512x512.png'),
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    autoHideMenuBar: true,
  });

  // Cargar la aplicación
  mainWindow.loadURL(APP_URL);

  // Abrir enlaces externos en el navegador predeterminado del sistema (no dentro de la ventana de Electron)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Maximizar por defecto si es pantalla de trabajo
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
