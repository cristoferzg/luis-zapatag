// Pone el ícono y los datos de InnovApp dentro del .exe sin necesitar Wine
// (se arma desde Linux). electron-builder no lo hace con signAndEditExecutable=false.
const path = require('path');
const fs = require('fs');
exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  const ResEdit = await import('resedit');
  const R = ResEdit.default || ResEdit;
  const exe = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.exe`);
  const data = fs.readFileSync(exe);
  const pe = R.NtExecutable.from(data, { ignoreCert: true });
  const res = R.NtExecutableResource.from(pe);
  const ico = R.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
  R.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, ico.icons.map(i => i.data));
  const vi = R.Resource.VersionInfo.fromEntries(res.entries)[0] || R.Resource.VersionInfo.createEmpty();
  const ver = ctx.packager.appInfo.version.split('.').map(Number);
  vi.setFileVersion(ver[0], ver[1], ver[2], 0, 1033);
  vi.setProductVersion(ver[0], ver[1], ver[2], 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    FileDescription: 'InnovApp - Innova Contratistas', ProductName: 'InnovApp', CompanyName: 'Innova Contratistas',
    LegalCopyright: 'Innova Contratistas', OriginalFilename: 'InnovApp.exe', InternalName: 'InnovApp',
  });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(pe);
  fs.writeFileSync(exe, Buffer.from(pe.generate()));
};
