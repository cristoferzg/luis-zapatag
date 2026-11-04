// InnovApp para Windows (Innova Contratistas).
// Abre la web publicada en su propia ventana, como un programa: así cada
// "firebase deploy" llega también a la PC sin reinstalar nada.
const { app, BrowserWindow, Menu, shell, screen, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://innovacontratistas-434d2.web.app';
const ORIGEN = new URL(APP_URL).origin;
// Marca para que la web sepa que corre en el programa de PC y con qué versión del programa
// (la web avisa si hay un instalador nuevo). No cambia el diseño de escritorio.
const AGENTE = `InnovaContratistasPC/${app.getVersion()}`;
const ICONO = path.join(__dirname, 'icon.png');

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
    return visible ? v : { maximizada: v.maximizada, zoom: v.zoom };
  } catch { return { maximizada: true }; }
}
function guardarVentana(win) {
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(archivoVentana(), JSON.stringify({ ...b, maximizada: win.isMaximized(), zoom: win.webContents.getZoomLevel() }));
  } catch { /* sin permiso de escritura: se ignora */ }
}

let win;
function crearVentana() {
  const v = leerVentana();
  win = new BrowserWindow({
    x: v.x, y: v.y, width: v.width || 1366, height: v.height || 850,
    minWidth: 1024, minHeight: 640,
    title: 'Innova Contratistas',
    icon: ICONO,
    backgroundColor: '#0f2a4a',
    show: false,
    autoHideMenuBar: true,
    // backgroundThrottling: que la grabación del 3D no se frene si la ventana queda detrás.
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true, backgroundThrottling: false },
  });
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} ${AGENTE}`);
  win.once('ready-to-show', () => { if (v.maximizada) win.maximize(); win.show(); });
  // Zoom con Ctrl + rueda del mouse (se recuerda para la próxima vez).
  const zoomInicial = Number.isFinite(v.zoom) ? v.zoom : 0;
  win.webContents.on('did-finish-load', () => win.webContents.setZoomLevel(zoomInicial));
  win.webContents.on('zoom-changed', (_e, dir) => {
    const z = win.webContents.getZoomLevel() + (dir === 'in' ? 0.5 : -0.5);
    win.webContents.setZoomLevel(Math.max(-3, Math.min(3, z)));
    guardarVentana(win);
  });

  // Ortografía en español y menú del clic derecho (copiar, pegar, corregir).
  try { win.webContents.session.setSpellCheckerLanguages(['es-ES', 'es']); } catch { /* sin diccionario */ }
  win.webContents.on('context-menu', (_e, p) => {
    const items = [];
    for (const sug of (p.dictionarySuggestions || []).slice(0, 5)) items.push({ label: sug, click: () => win.webContents.replaceMisspelling(sug) });
    if (p.misspelledWord) items.push({ label: 'Agregar al diccionario', click: () => win.webContents.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: 'separator' });
    if (p.isEditable) items.push({ role: 'cut', label: 'Cortar', enabled: p.editFlags.canCut }, { role: 'copy', label: 'Copiar', enabled: p.editFlags.canCopy }, { role: 'paste', label: 'Pegar', enabled: p.editFlags.canPaste }, { type: 'separator' }, { role: 'selectAll', label: 'Seleccionar todo' });
    else if (p.selectionText && p.selectionText.trim()) items.push({ role: 'copy', label: 'Copiar' });
    if (p.linkURL && /^https?:/.test(p.linkURL)) items.push({ type: 'separator' }, { label: 'Abrir enlace en el navegador', click: () => shell.openExternal(p.linkURL) }, { label: 'Copiar enlace', click: () => require('electron').clipboard.writeText(p.linkURL) });
    if (p.mediaType === 'image' && p.srcURL) items.push({ type: 'separator' }, { label: 'Guardar imagen…', click: () => win.webContents.downloadURL(p.srcURL) }, { label: 'Copiar imagen', click: () => win.webContents.copyImageAt(p.x, p.y) });
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });

  // Permisos (avisos, cámara, portapapeles…): solo para InnovApp, nunca para otras páginas.
  const deConfianza = (url) => { try { return new URL(url).origin === ORIGEN || String(url).startsWith('file:'); } catch { return false; } };
  win.webContents.session.setPermissionRequestHandler((wc, permiso, cb) => cb(deConfianza(wc.getURL()) && ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'pointerLock', 'geolocation'].includes(permiso)));
  win.webContents.session.setPermissionCheckHandler((wc, permiso, origen) => deConfianza(origen || (wc && wc.getURL()) || ''));

  // Si la página se cuelga o se cierra de golpe, se recupera sola.
  win.webContents.on('render-process-gone', (_e, d) => { if (d.reason !== 'clean-exit') setTimeout(() => win && !win.isDestroyed() && win.loadURL(APP_URL), 800); });
  win.on('unresponsive', async () => {
    const r = await dialog.showMessageBox(win, { type: 'warning', title: 'InnovApp', message: 'InnovApp no responde.', detail: 'Puedes esperar unos segundos (por ejemplo, si estás generando un 3D o un PDF grande) o recargar.', buttons: ['Esperar', 'Recargar'], defaultId: 0, cancelId: 0 });
    if (r.response === 1 && win && !win.isDestroyed()) win.webContents.reload();
  });
  ['resize', 'move', 'close'].forEach(ev => win.on(ev, () => guardarVentana(win)));

  // Ventanas que abre la web: impresión/PDF (about:blank, blob:) se quedan en el
  // programa; WhatsApp, correo y demás enlaces externos van al navegador normal.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || url.startsWith('blob:') || url.startsWith('data:')) {
      return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: ICONO } };
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
      try { new Notification({ title: 'Archivo guardado', body: `${path.basename(destino)} — en Descargas\\InnovApp`, icon: ICONO }).show(); } catch { /* sin avisos */ }
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
    { label: 'Recargar', accelerator: 'CmdOrCtrl+R', visible: false, click: () => win && win.loadURL(APP_URL) },
    { role: 'forceReload', label: 'Recargar sin caché', accelerator: 'Ctrl+F5' },
    { type: 'separator' },
    { role: 'resetZoom', label: 'Tamaño normal' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
    { type: 'separator' },
    { role: 'togglefullscreen', label: 'Pantalla completa', accelerator: 'F11' },
    { role: 'toggleDevTools', label: 'Herramientas de desarrollo', accelerator: 'Ctrl+Shift+I' },
  ] },
  { label: 'Ayuda', submenu: [
    { label: 'Abrir en el navegador', click: () => shell.openExternal(APP_URL) },
    { label: 'Abrir la carpeta de descargas', click: () => { const d = path.join(app.getPath('downloads'), 'InnovApp'); try { fs.mkdirSync(d, { recursive: true }); } catch { /* ya existe */ } shell.openPath(d); } },
    { type: 'separator' },
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
