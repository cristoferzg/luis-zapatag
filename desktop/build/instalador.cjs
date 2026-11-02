// Compila build/instalador.nsi con el makensis de electron-builder (Linux o Windows).
const { execFileSync } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const version = require('../package.json').version;
const base = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.cache'), 'electron-builder', 'nsis');
const nsis = fs.readdirSync(base).filter(d => /^nsis-\d/.test(d)).sort().pop();
if (!nsis) throw new Error('No se encontró NSIS; corre primero "electron-builder --win nsis" una vez para descargarlo.');
const dir = path.join(base, nsis);
const bin = process.platform === 'win32' ? path.join(dir, 'makensis.exe') : path.join(dir, process.platform === 'darwin' ? 'mac' : 'linux', 'makensis');
execFileSync(bin, [`-DVERSION=${version}`, '-V2', 'instalador.nsi'], { cwd: __dirname, stdio: 'inherit', env: { ...process.env, NSISDIR: dir } });
console.log(`Listo: release/InnovApp-Setup-${version}.exe`);
