// Archivos que se comparten con InnovApp desde otra app ("Compartir" / "Abrir con" de
// Android): un diseño .json se reconoce solo y se abre en su apartado (Techos o Carpintería).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { safeStorage } from './storageManager';

type Destino = 'techos' | 'herreria';
interface Pendiente { nombre: string; destino: Destino; data: any }
const KEY = 'innova_archivo_compartido';
const Archivos = registerPlugin<{ tomarCompartido(): Promise<{ nombre?: string; texto?: string }> }>('Archivos');

/** Techos: nudos y barras. Lo demás (piezas, inspector_cad…) lo revisa Carpintería. */
function destinoDe(d: any): Destino | null {
  if (!d || typeof d !== 'object') return null;
  if (d.nodes && d.segments) return 'techos';
  if (d.piezas || d.inspector_cad || d.perfiles || d.elementos || d.components) return 'herreria';
  return null;
}

function avisar(texto: string) {
  window.dispatchEvent(new CustomEvent('innova_toast', { detail: texto }));
  try { if (!document.querySelector('[data-aviso-compartido]')) { const el = document.createElement('div'); el.dataset.avisoCompartido = '1'; el.textContent = texto;
    el.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9999;background:#0f172a;color:#fff;padding:10px 14px;border-radius:14px;font:600 13px system-ui;max-width:90vw;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.3)';
    document.body.appendChild(el); setTimeout(() => el.remove(), 3500); } } catch { /* sin DOM */ }
}

/** Lo pide cada apartado al abrirse: entrega el archivo si es para él (una sola vez). */
export function tomarArchivoCompartido(destino: Destino): { nombre: string; data: any } | null {
  const p = safeStorage.getItem<Pendiente | null>(KEY, null);
  if (!p || p.destino !== destino) return null;
  safeStorage.removeItem(KEY);
  return { nombre: p.nombre, data: p.data };
}

async function revisar() {
  let r: { nombre?: string; texto?: string } = {};
  try { r = await Archivos.tomarCompartido(); } catch { return; }
  if (!r?.texto) return;
  const nombre = r.nombre || 'archivo.json';
  let data: any;
  try { data = JSON.parse(r.texto.replace(/^﻿/, '')); } catch { avisar('Ese archivo no es un diseño de InnovApp (.json).'); return; }
  const destino = destinoDe(data);
  if (!destino) { avisar('No se reconoció el diseño. Ábrelo desde Techos o Carpintería con "Subir CAD".'); return; }
  safeStorage.setItem(KEY, { nombre, destino, data } as Pendiente);
  // Se abre el apartado (si ya estaba abierto, se le avisa para que lo cargue).
  window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: destino }));
  setTimeout(() => window.dispatchEvent(new Event('innova_archivo_pendiente')), 400);
}

export function instalarArchivosCompartidos() {
  if (!Capacitor.isNativePlatform()) return;
  setTimeout(revisar, 2500); // al abrir la app desde "Compartir"
  window.addEventListener('innova_archivo_compartido', () => { revisar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(revisar, 600); });
}
