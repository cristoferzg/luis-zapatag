// ¿Este usuario puede ver este contenido de Academia / Recursos? Misma regla que las vistas
// (UsabilidadVideosView.hasAccessToVideo y BibliotecaPremiumView.hasAccess). Se usa para que
// "Novedades", la bandeja de avisos y las notificaciones solo anuncien lo que el usuario
// realmente encuentra al entrar (en la app de Android no se muestra lo de pago que no tiene).
import { comprasPermitidas } from './plataforma';

type ConAcceso = { isFree?: boolean; allowedUserIds?: string[] };
const tiene = (lista: string[] | undefined, uid?: string) => {
  if (!uid || !Array.isArray(lista)) return false;
  const base = uid.replace(/^user_/, '');
  return lista.some(x => x === uid || x === base || x === 'user_' + base);
};

export function accesoRecurso(item: ConAcceso & { precioSoles?: number }, uid?: string, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (item.isFree || (item.isFree !== false && (!item.precioSoles || item.precioSoles === 0))) return true;
  return tiene(item.allowedUserIds, uid);
}

export function accesoClase(video: ConAcceso & { category?: string }, cursos: (ConAcceso & { name: string })[], uid?: string, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (video.isFree !== false) return true;
  const curso = cursos.find(c => c.name === video.category);
  if (curso && curso.isFree !== false) return true;
  return tiene(curso?.allowedUserIds, uid) || tiene(video.allowedUserIds, uid);
}

/** ¿Aparece en la lista del usuario? En la web y la PC se ve todo (lo de pago, con precio);
 *  en la app de Android solo lo que ya tiene. */
export const visibleRecurso = (item: Parameters<typeof accesoRecurso>[0], uid?: string, isAdmin = false) =>
  comprasPermitidas() || accesoRecurso(item, uid, isAdmin);
export const visibleClase = (video: Parameters<typeof accesoClase>[0], cursos: Parameters<typeof accesoClase>[1], uid?: string, isAdmin = false) =>
  comprasPermitidas() || accesoClase(video, cursos, uid, isAdmin);
