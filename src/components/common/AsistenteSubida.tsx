// =============================================================================
// Asistente de subida en 3 pasos (admin) — Academia y Recursos Técnicos.
//
//   1. ¿Qué es?     título, descripción y categoría / curso.
//   2. Archivos      portada, archivo principal (o enlace de video) y adjuntos
//                    múltiples con arrastrar y soltar y barra de progreso.
//   3. Publicación   gratis / pago, descuento con fecha, ⭐ destacado, 🎞️ slider.
//
// Siempre muestra a la derecha (abajo en el celular) la tarjeta tal como la
// verá el usuario. Guarda un borrador local mientras se llena.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, UploadCloud, Image as ImageIcon, FileText, Paperclip,
  Trash2, Check, Star, GalleryHorizontal, Link2, Video, Loader2, Tag,
} from 'lucide-react';
import { uploadFileToFirebaseStorage } from '../../lib/storage';
import { safeStorage } from '../../lib/storageManager';

export interface AdjuntoSubido { nombre: string; url: string; tipo: string; tamano?: number }

export interface BorradorSubida {
  titulo: string;
  descripcion: string;
  categoria: string;
  portadaUrl: string;
  archivoUrl: string;      // documento (recurso) o video (clase)
  archivoNombre: string;
  enlaceVideo: string;     // clase: YouTube / MP4 en vez de archivo
  adjuntos: AdjuntoSubido[];
  isFree: boolean;
  precio: number;
  precioAntes: number;     // 0 = sin precio tachado
  descuentoPct: number;
  descuentoHasta: string;  // 'YYYY-MM-DDTHH:mm' o ''
  destacado: boolean;
  enSlider: boolean;
  masComprado: boolean;
}

export const borradorVacio = (p: Partial<BorradorSubida> = {}): BorradorSubida => ({
  titulo: '', descripcion: '', categoria: '', portadaUrl: '', archivoUrl: '', archivoNombre: '',
  enlaceVideo: '', adjuntos: [], isFree: true, precio: 0, precioAntes: 0, descuentoPct: 0,
  descuentoHasta: '', destacado: false, enSlider: false, masComprado: false, ...p,
});

type Modo = 'recurso' | 'clase' | 'curso';

interface Props {
  modo: Modo;
  editando: boolean;
  inicial: BorradorSubida;
  categorias: string[];
  onGuardar: (b: BorradorSubida) => Promise<void> | void;
  onCerrar: () => void;
}

interface Subida { id: string; nombre: string; pct: number; error?: string }

const NOMBRES: Record<Modo, { uno: string; cat: string; principal: string }> = {
  recurso: { uno: 'recurso técnico', cat: 'Categoría', principal: 'Documento principal (PDF, DWG, ZIP…)' },
  clase: { uno: 'clase', cat: 'Curso al que pertenece', principal: 'Video de la clase' },
  curso: { uno: 'curso', cat: 'Categoría del curso', principal: '' },
};

const PASOS = ['¿Qué es?', 'Archivos', 'Publicación'];

const tam = (b?: number) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const leerDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});

export default function AsistenteSubida({ modo, editando, inicial, categorias, onGuardar, onCerrar }: Props) {
  const claveBorrador = `asistente_subida_borrador_${modo}`;
  const [b, setB] = useState<BorradorSubida>(inicial);
  const [paso, setPaso] = useState(0);
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borradorPrevio, setBorradorPrevio] = useState<BorradorSubida | null>(() => {
    if (editando) return null;
    const g = safeStorage.getItem<BorradorSubida | null>(claveBorrador, null);
    return g && (g.titulo || g.descripcion || g.adjuntos?.length) ? g : null;
  });
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const cancelados = useRef(new Set<string>());
  const refPortada = useRef<HTMLInputElement>(null);
  const refPrincipal = useRef<HTMLInputElement>(null);
  const refAdjuntos = useRef<HTMLInputElement>(null);
  const n = NOMBRES[modo];

  const set = (p: Partial<BorradorSubida>) => setB(prev => ({ ...prev, ...p }));

  // Borrador local (solo al crear).
  useEffect(() => {
    if (editando || borradorPrevio) return;
    const t = setTimeout(() => safeStorage.setItem(claveBorrador, b), 400);
    return () => clearTimeout(t);
  }, [b, editando, borradorPrevio, claveBorrador]);

  const subir = async (file: File, carpeta: string, permitirLocal: boolean): Promise<string | null> => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setSubidas(s => [...s, { id, nombre: file.name, pct: 0 }]);
    try {
      const url = await uploadFileToFirebaseStorage(file, carpeta, pct => setSubidas(s => s.map(x => x.id === id ? { ...x, pct } : x)));
      setSubidas(s => s.filter(x => x.id !== id));
      return cancelados.current.has(id) ? null : url;
    } catch (e: any) {
      if (cancelados.current.has(id)) return null;
      if (permitirLocal && file.size < 1.5 * 1024 * 1024) {
        setSubidas(s => s.filter(x => x.id !== id));
        return leerDataUrl(file);
      }
      const cod = String(e?.code || e?.message || '');
      const msg = /unauthorized|permission/i.test(cod) ? 'no hay permiso para guardar en la nube (revisa la sesión de administrador).'
        : /quota|exceeded/i.test(cod) ? 'se llenó el espacio de almacenamiento.'
        : /network|retry-limit/i.test(cod) ? 'sin conexión, inténtalo de nuevo.' : 'error al guardar en la nube.';
      setSubidas(s => s.map(x => x.id === id ? { ...x, error: msg } : x));
      return null;
    }
  };

  const subirPortada = async (files: FileList | File[] | null) => {
    const f = files && Array.from(files).find(x => x.type.startsWith('image/'));
    if (!f) { setError('La portada debe ser una imagen (JPG, PNG o WEBP).'); return; }
    setError(null);
    const url = await subir(f, modo === 'recurso' ? 'biblioteca_previews' : 'thumbnails', true);
    if (url) set({ portadaUrl: url });
  };

  const subirPrincipal = async (files: FileList | File[] | null) => {
    const f = files && Array.from(files)[0];
    if (!f) return;
    if (modo === 'clase' && !f.type.startsWith('video/')) { setError('Para la clase elige un archivo de video (MP4, MOV, WEBM).'); return; }
    setError(null);
    const url = await subir(f, modo === 'clase' ? 'videos' : 'biblioteca', modo === 'recurso');
    if (!url) return;
    const autoTitulo = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    setB(prev => ({ ...prev, archivoUrl: url, archivoNombre: f.name, enlaceVideo: '', titulo: prev.titulo || autoTitulo.charAt(0).toUpperCase() + autoTitulo.slice(1) }));
  };

  const subirAdjuntos = async (files: FileList | File[] | null) => {
    if (!files) return;
    setError(null);
    for (const f of Array.from(files)) {
      const url = await subir(f, 'adjuntos', false);
      if (url) setB(prev => ({ ...prev, adjuntos: [...prev.adjuntos, { nombre: f.name, url, tipo: f.type || 'archivo', tamano: f.size }] }));
    }
  };

  const zona = (clave: string, onFiles: (f: FileList) => void) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setArrastrando(clave); },
    onDragLeave: () => setArrastrando(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setArrastrando(null); onFiles(e.dataTransfer.files); },
  });

  const validarPaso = (p: number): string | null => {
    if (p === 0) {
      if (!b.titulo.trim()) return `Escribe el nombre del ${n.uno}.`;
      if (modo !== 'curso' && !b.categoria.trim()) return `Elige ${modo === 'clase' ? 'el curso' : 'una categoría'}.`;
    }
    if (p === 1) {
      if (subidas.some(s => !s.error)) return 'Espera a que terminen de subir los archivos.';
      if (modo === 'clase' && !b.archivoUrl && !b.enlaceVideo.trim()) return 'Sube el video o pega un enlace de YouTube / MP4.';
    }
    if (p === 2 && !b.isFree && !(b.precio > 0)) return 'Indica el precio o márcalo como gratis.';
    return null;
  };

  const siguiente = () => {
    const e = validarPaso(paso);
    if (e) { setError(e); return; }
    setError(null); setPaso(p => Math.min(2, p + 1));
  };

  const guardar = async () => {
    for (let p = 0; p < 3; p++) { const e = validarPaso(p); if (e) { setError(e); setPaso(p); return; } }
    setGuardando(true);
    try {
      await onGuardar(b);
      if (!editando) safeStorage.removeItem(claveBorrador);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
      setGuardando(false);
    }
  };

  const precioFinal = b.isFree ? 0 : b.descuentoPct > 0 ? +(b.precio * (1 - b.descuentoPct / 100)).toFixed(2) : b.precio;
  const tachado = b.isFree ? 0 : b.descuentoPct > 0 ? b.precio : b.precioAntes > b.precio ? b.precioAntes : 0;

  const Vista = (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Así lo verá el usuario</p>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-indigo-900 flex items-center justify-center">
          {b.portadaUrl
            ? <img src={b.portadaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <ImageIcon className="w-10 h-10 text-white/30" />}
          <div className="absolute top-2 left-2 flex gap-1">
            {b.destacado && <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md">⭐ Destacado</span>}
            {b.descuentoPct > 0 && !b.isFree && <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">-{b.descuentoPct}%</span>}
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-indigo-600 uppercase truncate">{b.categoria || n.cat}</p>
          <p className="text-sm font-black text-slate-800 leading-tight line-clamp-2">{b.titulo || `Nombre del ${n.uno}`}</p>
          <p className="text-[11px] text-slate-500 line-clamp-2">{b.descripcion || 'Descripción breve…'}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-base font-black ${b.isFree ? 'text-emerald-600' : 'text-slate-900'}`}>{b.isFree ? 'Gratis' : `S/ ${precioFinal.toFixed(2)}`}</span>
              {tachado > 0 && <span className="text-[11px] text-slate-400 line-through">S/ {tachado.toFixed(2)}</span>}
            </div>
            {b.adjuntos.length > 0 && <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Paperclip className="w-3 h-3" />{b.adjuntos.length}</span>}
          </div>
        </div>
      </div>
      {b.enSlider && <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">🎞️ También aparecerá en el carrusel de arriba</p>}
    </div>
  );

  const etiqueta = 'block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1';
  const campo = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white';
  const interruptor = (activo: boolean, onClick: () => void, icono: React.ReactNode, titulo: string, detalle: string) => (
    <button type="button" onClick={onClick} className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${activo ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
      <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${activo ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{activo && <Check className="w-3.5 h-3.5" />}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">{icono}{titulo}</span>
        <span className="block text-[11px] text-slate-500 leading-snug">{detalle}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[96vh] sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera + pasos */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-black text-slate-800 truncate">{editando ? 'Editar' : modo === 'clase' ? 'Nueva' : 'Nuevo'} {n.uno}</h2>
            <button type="button" onClick={onCerrar} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {PASOS.map((t, i) => (
              <button key={t} type="button" onClick={() => { if (i < paso) setPaso(i); else if (i === paso + 1) siguiente(); }}
                className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i < paso ? 'bg-emerald-500 text-white' : i === paso ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i < paso ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span className={`text-xs font-bold truncate ${i === paso ? 'text-slate-800' : 'text-slate-400'}`}>{t}</span>
                {i < 2 && <span className={`hidden sm:block flex-1 h-0.5 rounded ${i < paso ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-[1fr_260px] gap-5 p-4 sm:p-6">
            <div className="space-y-4 min-w-0">
              {borradorPrevio && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-amber-800">Tienes un borrador sin terminar: “{borradorPrevio.titulo || 'sin título'}”.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setB(borradorPrevio); setBorradorPrevio(null); }} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer">Recuperar</button>
                    <button type="button" onClick={() => { safeStorage.removeItem(claveBorrador); setBorradorPrevio(null); }} className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 text-xs font-bold rounded-lg cursor-pointer">Descartar</button>
                  </div>
                </div>
              )}

              {paso === 0 && (
                <>
                  <div>
                    <label className={etiqueta}>Nombre del {n.uno}</label>
                    <input autoFocus className={campo} value={b.titulo} onChange={e => set({ titulo: e.target.value })}
                      placeholder={modo === 'recurso' ? 'Ej. Planos de tijerales para nave 12 m' : modo === 'clase' ? 'Ej. Clase 1 · Corte y biselado' : 'Ej. Soldadura MIG desde cero'} />
                  </div>
                  <div>
                    <label className={etiqueta}>Descripción</label>
                    <textarea className={`${campo} h-24 resize-none`} value={b.descripcion} onChange={e => set({ descripcion: e.target.value })}
                      placeholder="¿Qué va a aprender o recibir el usuario? Sé breve y concreto." />
                  </div>
                  {modo !== 'curso' && <div>
                    <label className={etiqueta}>{n.cat}</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {categorias.map(c => (
                        <button key={c} type="button" onClick={() => set({ categoria: c })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${b.categoria === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>{c}</button>
                      ))}
                    </div>
                    {modo !== 'clase' && (
                      <input className={campo} value={b.categoria} onChange={e => set({ categoria: e.target.value })} placeholder="…o escribe una nueva" />
                    )}
                    {modo === 'clase' && categorias.length === 0 && <p className="text-xs text-amber-700">Primero crea un curso.</p>}
                  </div>}
                </>
              )}

              {paso === 1 && (
                <>
                  {/* Portada */}
                  <div>
                    <label className={etiqueta}>Imagen de portada</label>
                    <div {...zona('portada', f => subirPortada(f))} onClick={() => refPortada.current?.click()}
                      className={`relative rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden flex items-center gap-3 p-3 ${arrastrando === 'portada' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}>
                      <div className="w-24 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {b.portadaUrl ? <img src={b.portadaUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-700">{b.portadaUrl ? 'Cambiar portada' : 'Toca o arrastra una imagen'}</p>
                        <p className="text-[11px] text-slate-500">Horizontal 16:9 se ve mejor (ej. 1280×720). Se optimiza sola.</p>
                      </div>
                      {b.portadaUrl && <button type="button" onClick={e => { e.stopPropagation(); set({ portadaUrl: '' }); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" aria-label="Quitar portada"><Trash2 className="w-4 h-4" /></button>}
                      <input ref={refPortada} type="file" accept="image/*" className="hidden" onChange={e => { subirPortada(e.target.files); e.target.value = ''; }} />
                    </div>
                  </div>

                  {/* Principal */}
                  {modo !== 'curso' && (
                    <div>
                      <label className={etiqueta}>{n.principal}</label>
                      <div {...zona('principal', f => subirPrincipal(f))} onClick={() => refPrincipal.current?.click()}
                        className={`rounded-2xl border-2 border-dashed cursor-pointer flex items-center gap-3 p-3 ${arrastrando === 'principal' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}>
                        <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {modo === 'clase' ? <Video className="w-5 h-5 text-indigo-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-700 truncate">{b.archivoNombre || (b.archivoUrl ? 'Archivo cargado' : 'Toca o arrastra el archivo')}</p>
                          <p className="text-[11px] text-slate-500">{b.archivoUrl ? '✓ Listo' : modo === 'clase' ? 'MP4, MOV o WEBM' : 'PDF, DWG, DXF, XLSX, ZIP…'}</p>
                        </div>
                        {b.archivoUrl && <button type="button" onClick={e => { e.stopPropagation(); set({ archivoUrl: '', archivoNombre: '' }); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" aria-label="Quitar archivo"><Trash2 className="w-4 h-4" /></button>}
                        <input ref={refPrincipal} type="file" accept={modo === 'clase' ? 'video/*' : undefined} className="hidden" onChange={e => { subirPrincipal(e.target.files); e.target.value = ''; }} />
                      </div>
                      {modo === 'clase' && (
                        <div className="mt-2 relative">
                          <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input className={`${campo} pl-9`} value={b.enlaceVideo} onChange={e => set({ enlaceVideo: e.target.value, ...(e.target.value ? { archivoUrl: '', archivoNombre: '' } : {}) })}
                            placeholder="…o pega un enlace de YouTube / MP4" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjuntos */}
                  <div>
                    <label className={etiqueta}>Archivos e imágenes adjuntas <span className="normal-case font-bold text-slate-400">(opcional · varios a la vez)</span></label>
                    <div {...zona('adjuntos', f => subirAdjuntos(f))} onClick={() => refAdjuntos.current?.click()}
                      className={`rounded-2xl border-2 border-dashed cursor-pointer p-4 text-center ${arrastrando === 'adjuntos' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}>
                      <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 mt-1">Toca o arrastra aquí</p>
                      <p className="text-[11px] text-slate-500">Fotos del proceso, fichas técnicas, planos, hojas de cálculo…</p>
                      <input ref={refAdjuntos} type="file" multiple className="hidden" onChange={e => { subirAdjuntos(e.target.files); e.target.value = ''; }} />
                    </div>
                    {(b.adjuntos.length > 0 || subidas.length > 0) && (
                      <ul className="mt-2 space-y-1.5">
                        {b.adjuntos.map((a, i) => (
                          <li key={a.url + i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
                            <span className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              {a.tipo.startsWith('image/') ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-slate-700 truncate">{a.nombre}</span>
                              <span className="block text-[10px] text-slate-400">{tam(a.tamano)}</span>
                            </span>
                            <button type="button" onClick={() => set({ adjuntos: b.adjuntos.filter((_, j) => j !== i) })} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" aria-label={`Quitar ${a.nombre}`}><Trash2 className="w-4 h-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {subidas.length > 0 && (
                    <ul className="space-y-1.5">
                      {subidas.map(s => (
                        <li key={s.id} className={`rounded-xl border p-2 ${s.error ? 'border-rose-200 bg-rose-50' : 'border-indigo-100 bg-indigo-50/50'}`}>
                          <div className="flex items-center justify-between gap-2 text-xs font-bold">
                            <span className="truncate text-slate-700 flex items-center gap-1.5">{!s.error && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}{s.nombre}</span>
                            <span className="flex items-center gap-2 shrink-0">
                              {!s.error && <span className="text-indigo-700">{s.pct}%</span>}
                              <button type="button" onClick={() => { cancelados.current.add(s.id); setSubidas(x => x.filter(y => y.id !== s.id)); }}
                                className="text-rose-600 cursor-pointer">{s.error ? 'Quitar' : 'Cancelar'}</button>
                            </span>
                          </div>
                          {s.error ? <p className="text-[11px] text-rose-700 mt-0.5">No se pudo subir: {s.error}</p>
                            : <div className="h-1.5 bg-indigo-100 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${s.pct}%` }} /></div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {paso === 2 && (
                <>
                  <div>
                    <label className={etiqueta}>Acceso</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: true, t: 'Gratis', d: 'Todos lo ven' }, { v: false, t: 'De pago', d: 'Se habilita al validar la compra' }].map(o => (
                        <button key={o.t} type="button" onClick={() => set({ isFree: o.v })}
                          className={`p-3 rounded-xl border text-left cursor-pointer ${b.isFree === o.v ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                          <span className="block text-sm font-black text-slate-800">{o.t}</span>
                          <span className="block text-[11px] text-slate-500">{o.d}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!b.isFree && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={etiqueta}>Precio (S/)</label>
                        <input type="number" min={0} step="0.1" inputMode="decimal" className={campo} value={b.precio || ''} onChange={e => set({ precio: Number(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className={etiqueta}>Precio antes (S/)</label>
                        <input type="number" min={0} step="0.1" inputMode="decimal" className={campo} value={b.precioAntes || ''} onChange={e => set({ precioAntes: Number(e.target.value) || 0 })} placeholder="Opcional" />
                      </div>
                      <div>
                        <label className={etiqueta}><Tag className="w-3 h-3 inline -mt-0.5" /> Descuento %</label>
                        <input type="number" min={0} max={90} inputMode="numeric" className={campo} value={b.descuentoPct || ''} onChange={e => set({ descuentoPct: Math.min(90, Math.max(0, Number(e.target.value) || 0)) })} placeholder="0" />
                      </div>
                      <div>
                        <label className={etiqueta}>Descuento hasta</label>
                        <input type="datetime-local" className={campo} value={b.descuentoHasta} onChange={e => set({ descuentoHasta: e.target.value })} disabled={!b.descuentoPct} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className={etiqueta}>Visibilidad</label>
                    {interruptor(b.destacado, () => set({ destacado: !b.destacado }), <Star className="w-4 h-4 text-amber-500" />, 'Destacado',
                      'Aparece en la pestaña “Destacados” (solo lo marcado aparece ahí).')}
                    {interruptor(b.enSlider, () => set({ enSlider: !b.enSlider }), <GalleryHorizontal className="w-4 h-4 text-indigo-600" />, 'Mostrar en el carrusel',
                      'Banner grande arriba, con botón “Adquirir” y cuenta regresiva del descuento.')}
                    {modo === 'recurso' && interruptor(b.masComprado, () => set({ masComprado: !b.masComprado }), <span>🔥</span>, 'Más comprado', 'Sello de “Más comprado” en la tarjeta.')}
                  </div>
                  <div className="md:hidden pt-2">{Vista}</div>
                </>
              )}

              {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
            </div>

            <div className="hidden md:block">{Vista}</div>
          </div>
        </div>

        {/* Pie */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50/60">
          <button type="button" onClick={() => (paso === 0 ? onCerrar() : setPaso(p => p - 1))}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer">
            {paso === 0 ? 'Cancelar' : <><ChevronLeft className="w-4 h-4" />Atrás</>}
          </button>
          {paso < 2 ? (
            <button type="button" onClick={siguiente} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black flex items-center gap-1 cursor-pointer">
              Siguiente<ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={guardar} disabled={guardando} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{editando ? 'Guardar cambios' : 'Publicar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
