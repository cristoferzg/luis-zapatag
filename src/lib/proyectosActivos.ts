// Lista de proyectos del usuario (Proyectos & Clientes) a mano para cualquier apartado de diseño,
// sin pasarla por props: App la fija con `fijarProyectos` y los apartados la leen con `useProyectos`.
import { useEffect, useState } from 'react';
import type { Project } from '../types';

let lista: Project[] = [];
const oyentes = new Set<(l: Project[]) => void>();

export function fijarProyectos(l: Project[]) {
  lista = Array.isArray(l) ? l : [];
  oyentes.forEach(f => f(lista));
}

export function useProyectos(): Project[] {
  const [l, setL] = useState<Project[]>(lista);
  useEffect(() => { oyentes.add(setL); setL(lista); return () => { oyentes.delete(setL); }; }, []);
  return l;
}

// ── «Enviar al proyecto» ────────────────────────────────────────────────────────
// Cada apartado manda su cotización como una PARTIDA del proyecto vinculado. La partida se identifica
// por apartado + id de cotización: volver a enviarla la ACTUALIZA (no se duplica). El presupuesto del
// proyecto suma la diferencia (así se respetan los montos que el usuario puso a mano).
export interface PartidaEnviada { clave: string; apartado: string; nombre: string; total: number; fecha: string }
let manejador: ((projectId: string, pt: PartidaEnviada) => void) | null = null;
export function fijarManejadorEnvio(fn: (projectId: string, pt: PartidaEnviada) => void) { manejador = fn; }
export function enviarAlProyecto(projectId: string, pt: Omit<PartidaEnviada, 'fecha'>): boolean {
  if (!manejador || !projectId) return false;
  manejador(projectId, { ...pt, total: Math.round((pt.total || 0) * 100) / 100, fecha: new Date().toISOString() });
  return true;
}
/** Proyecto con la partida puesta o actualizada. */
export function conPartida<P extends { presupuesto: number; partidas?: PartidaEnviada[] }>(p: P, pt: PartidaEnviada): P {
  const antes = (p.partidas || []).find(x => x.clave === pt.clave);
  const partidas = [...(p.partidas || []).filter(x => x.clave !== pt.clave), pt];
  return { ...p, partidas, presupuesto: Math.round(((Number(p.presupuesto) || 0) + pt.total - (antes?.total || 0)) * 100) / 100 };
}
