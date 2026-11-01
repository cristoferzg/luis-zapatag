// Fecha y hora en que se compiló esta versión de la app (hora de Lima, "01/11 09:52").
// Junto a la versión que escribe el admin en Configuración, dice si un equipo tiene lo último.
export const fechaCompilacion = new Date(__BUILD__)
  .toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  .replace(',', '');
