// Tarjeta de plantilla / recurso con el MISMO diseño que la de los cursos (pedido del dueño, 17/11/2026):
// portada 16:9 completa, etiquetas arriba, tipo de archivo abajo, título en 2 líneas, descripción y pie
// (precio / acceso / acciones). La usan la Tienda y «Mis plantillas».
import type { ReactNode } from 'react';
import { Layers, BookOpen, FileSpreadsheet, FileText, FileType2, Ruler, Star, Download, Box } from 'lucide-react';
import type { BibliotecaItem } from '../BibliotecaPremiumView';

const MODULO: Record<string, string> = { techos: 'Techos Metálicos', carpimetal: 'Carpintería Metálica', drywall: 'Drywall' };

/** Qué es el archivo, dicho en simple, con su ícono. */
export function tipoRecurso(r: BibliotecaItem): { texto: string; Icono: typeof Layers; fondo: string } {
  if (r.plantilla) return { texto: `Se abre en ${MODULO[r.plantilla.modulo] || 'el programa'}`, Icono: Layers, fondo: 'from-emerald-600 to-teal-800' };
  const ext = (r.fileName || '').toLowerCase().split('.').pop() || '';
  if (/xlsx?|csv/.test(ext)) return { texto: 'Excel editable', Icono: FileSpreadsheet, fondo: 'from-green-600 to-emerald-800' };
  if (/docx?/.test(ext)) return { texto: 'Word editable', Icono: FileType2, fondo: 'from-sky-600 to-blue-800' };
  if (/dwg|dxf/.test(ext)) return { texto: 'Plano CAD', Icono: Ruler, fondo: 'from-indigo-600 to-violet-800' };
  if (r.tipo === 'plano') return { texto: 'Plano en PDF', Icono: Ruler, fondo: 'from-indigo-600 to-slate-800' };
  if (r.tipo === 'libro') return { texto: 'Libro en PDF', Icono: BookOpen, fondo: 'from-amber-600 to-orange-800' };
  return { texto: 'Documento PDF', Icono: FileText, fondo: 'from-slate-600 to-slate-800' };
}

const Insignia = ({ tono, children }: { tono: string; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black shadow ${tono}`}>{children}</span>
);

interface Props {
  r: BibliotecaItem;
  gratis?: boolean;
  descuento?: number;
  onClick?: () => void;
  pie: ReactNode;            // precio / acceso a la izquierda y acción a la derecha (o botones)
  extra?: ReactNode;         // herramientas del admin, aviso de oferta…
  onVer3D?: () => void;      // mini visor 3D (solo plantillas de Techos y Carpintería Metálica)
}

/** ¿La plantilla se puede mirar en 3D? */
export const tiene3D = (r: BibliotecaItem) => (!!r.plantilla && r.plantilla.modulo !== 'drywall') || (!r.plantilla && /\.json$/i.test(r.fileName || '') && !!r.enlaceDescargaUrl);

export default function TarjetaRecurso({ r, gratis, descuento, onClick, pie, extra, onVer3D }: Props) {
  const t = tipoRecurso(r);
  return (
    <article onClick={onClick}
      className={`group min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="relative aspect-video overflow-hidden">
        {r.previewImageUrl
          ? <img src={r.previewImageUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`w-full h-full bg-gradient-to-br ${t.fondo} flex flex-col items-center justify-center gap-2 px-6 text-center`}>
              <t.Icono className="w-11 h-11 text-white/85" />
              <span className="text-white/90 text-sm font-black leading-tight line-clamp-2">{r.titulo}</span>
            </div>}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
        <div className={`absolute top-2 left-2 flex flex-wrap gap-1 ${onVer3D ? 'right-28' : 'right-2'}`}>
          {r.plantilla && <Insignia tono="bg-emerald-600 text-white"><Layers className="w-3 h-3" />Plantilla editable</Insignia>}
          {r.isDestacado && <Insignia tono="bg-amber-400 text-slate-950"><Star className="w-3 h-3" />Destacado</Insignia>}
          {r.isMasComprado && <Insignia tono="bg-amber-400 text-slate-950">Más comprado</Insignia>}
          {gratis ? <Insignia tono="bg-emerald-500 text-white">Gratis</Insignia> : descuento ? <Insignia tono="bg-rose-600 text-white">-{descuento}%</Insignia> : null}
        </div>
        {onVer3D && (
          <button type="button" onClick={e => { e.stopPropagation(); onVer3D(); }}
            className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-slate-900 text-[11px] font-black shadow flex items-center gap-1 cursor-pointer">
            <Box className="w-3.5 h-3.5 text-emerald-600" />Ver en 3D
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold min-w-0">
          <span className="flex items-center gap-1 text-emerald-700 shrink-0"><t.Icono className="w-3.5 h-3.5" />{t.texto}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400 uppercase tracking-wide truncate">{r.categoria}</span>
          {!!r.adjuntos?.length && <span className="ml-auto flex items-center gap-0.5 text-slate-500 shrink-0"><Download className="w-3.5 h-3.5" />+{r.adjuntos.length}</span>}
        </div>
        <h3 className="font-black text-slate-900 leading-snug line-clamp-2">{r.titulo}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{r.descripcion || 'Material técnico de la Academia.'}</p>
        {extra}
        <div className="mt-3" onClick={e => e.stopPropagation()}>{pie}</div>
      </div>
    </article>
  );
}

// Búsqueda tolerante (Tienda y Mis plantillas): sin tildes, plural o singular («plantillas» = «plantilla»)
// y por lo que ES el archivo (plantilla editable, Excel, Word, PDF, plano…).
const normal = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const raiz = (w: string) => w.length > 5 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w;
export function coincideBusqueda(q: string, ...textos: (string | undefined)[]): boolean {
  const palabras = normal(q).split(/[^a-z0-9ñ]+/).filter(Boolean).map(raiz);
  if (!palabras.length) return true;
  const todo = normal(textos.filter(Boolean).join(' '));
  return palabras.every(w => todo.includes(w));
}
export const textoDeRecurso = (r: BibliotecaItem) =>
  [r.titulo, r.descripcion, r.categoria, tipoRecurso(r).texto, r.plantilla ? 'plantilla editable diseño' : '', r.fileName, r.tipo].filter(Boolean).join(' ');
