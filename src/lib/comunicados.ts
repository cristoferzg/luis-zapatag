// Comunicados del administrador: se escriben y quitan uno por uno, directo en la base.
// (Antes se reescribía toda la lista y, si el equipo tenía una copia vieja, se podían
// perder comunicados.) Todos quedan guardados: los vencidos solo dejan de mostrarse arriba.
import { addRecord, deleteRecord } from './db';
import type { GlobalNotification } from '../types';

export const publicarComunicado = (n: GlobalNotification) => addRecord('notificaciones', n.id, n, 'admin');
export const quitarComunicado = (id: string) => deleteRecord('notificaciones', id);
