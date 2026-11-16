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
