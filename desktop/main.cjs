// InnovApp para Windows (Innova Contratistas).
// Abre la web publicada en su propia ventana, como un programa: así cada
// "firebase deploy" llega también a la PC sin reinstalar nada.
const { app, BrowserWindow, Menu, shell, screen, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://innovacontratistas-434d2.web.app';
const ORIGEN = new URL(APP_URL).origin;
// Marca para que la web sepa que corre en el programa de PC (no cambia el diseño de escritorio).
const AGENTE = 'InnovaContratistasPC/1.0';

// Una sola ventana: si ya está abierto, se trae al frente.
if (!app.requestSingleInstanceLock()) { app.quit(); }

const archivoVentana = () => path.join(app.getPath('userData'), 'ventana.json');
function leerVentana() {
  try {
    const v = JSON.parse(fs.readFileSync(archivoVentana(), 'utf8'));
    // Que la ventana guardada siga cayendo dentro de alguna pantalla.
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return v.x < a.x + a.width - 80 && v.x + v.width > a.x + 80 && v.y < a.y + a.height - 80 && v.y + 40 > a.y;
    });
    return visible ? v : { maximizada: v.maximizada };
  } catch { return { maximizada: true }; }
}
function guardarVentana(win) {
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(archivoVentana(), JSON.stringify({ ...b, maximizada: win.isMaximized() }));
  } catch { /* sin permiso de escritura: se ignora */ }
}

let win;
function crearVentana() {
  const v = leerVentana();
  win = new BrowserWindow({
    x: v.x, y: v.y, width: v.width || 1366, height: v.height || 850,
    minWidth: 1024, minHeight: 640,
    title: 'Innova Contratistas',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0f2a4a',
    show: false,
    autoHideMenuBar: true,
    // backgroundThrottling: que la grabación del 3D no se frene si la ventana queda detrás.
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true, backgroundThrottling: false },
  });
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} ${AGENTE}`);
  win.once('ready-to-show', () => { if (v.maximizada) win.maximize(); win.show(); });
  ['resize', 'move', 'close'].forEach(ev => win.on(ev, () => guardarVentana(win)));

  // Ventanas que abre la web: impresión/PDF (about:blank, blob:) se quedan en el
  // programa; WhatsApp, correo y demás enlaces externos van al navegador normal.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || url.startsWith('blob:') || url.startsWith('data:')) {
      return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png') } };
    }
    if (/^(https?:|mailto:|tel:|whatsapp:)/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    if (!url.startsWith(ORIGEN)) { e.preventDefault(); shell.openExternal(url); }
  });

  // Descargas (videos 3D, PDF, DXF…): directo a Descargas\InnovApp, sin preguntar,
  // con aviso al terminar y la carpeta abierta con el archivo marcado.
  win.webContents.session.on('will-download', (_e, item) => {
    const dir = path.join(app.getPath('downloads'), 'InnovApp');
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ya existe */ }
    const base = item.getFilename() || 'archivo';
    const ext = path.extname(base), nom = path.basename(base, ext);
    let destino = path.join(dir, base), i = 1;
    while (fs.existsSync(destino)) destino = path.join(dir, `${nom} (${i++})${ext}`);
    item.setSavePath(destino);
    item.once('done', (_ev, estado) => {
      if (estado !== 'completed') return;
      try { new Notification({ title: 'Archivo guardado', body: `${path.basename(destino)} — en Descargas\\InnovApp`, icon: path.join(__dirname, 'icon.png') }).show(); } catch { /* sin avisos */ }
      shell.showItemInFolder(destino);
    });
  });

  // Sin internet: pantalla propia con "Reintentar".
  win.webContents.on('did-fail-load', (_e, codigo, _desc, url, principal) => {
    if (principal && codigo !== -3 && !String(url).startsWith('file:')) win.loadFile(path.join(__dirname, 'offline.html'));
  });

  win.loadURL(APP_URL);
}

// Menú oculto (Alt lo muestra) con los atajos de un programa.
const menu = Menu.buildFromTemplate([
  { label: 'Archivo', submenu: [
    { label: 'Imprimir…', accelerator: 'CmdOrCtrl+P', click: () => win && win.webContents.print() },
    { type: 'separator' },
    { role: 'quit', label: 'Salir' },
  ] },
  { label: 'Editar', submenu: [
    { role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' },
    { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' },
  ] },
  { label: 'Ver', submenu: [
    { label: 'Recargar', accelerator: 'F5', click: () => win && win.loadURL(APP_URL) },
    { role: 'forceReload', label: 'Recargar sin caché', accelerator: 'Ctrl+F5' },
    { type: 'separator' },
    { role: 'resetZoom', label: 'Tamaño normal' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
    { type: 'separator' },
    { role: 'togglefullscreen', label: 'Pantalla completa', accelerator: 'F11' },
    { role: 'toggleDevTools', label: 'Herramientas de desarrollo', accelerator: 'Ctrl+Shift+I' },
  ] },
  { label: 'Ayuda', submenu: [
    { label: 'Abrir en el navegador', click: () => shell.openExternal(APP_URL) },
    { label: `Versión del programa ${app.getVersion()}`, enabled: false },
  ] },
]);

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  app.setAppUserModelId('pe.innovacontratistas.pc');
  Menu.setApplicationMenu(menu);
  crearVentana();
});
app.on('window-all-closed', () => app.quit());
