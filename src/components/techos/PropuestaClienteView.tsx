// =============================================================================
// Propuesta visual para el cliente (PDF): portada con la imagen 3D del techo
// (y el antes/después sobre la foto real del lugar), tres opciones de precio
// —económica, estándar y premium— que cambian solo la cobertura, lo que incluye
// la obra y las condiciones comerciales de la plantilla de la empresa.
// También publica un link para que el cliente vea el techo en 3D y acepte.
// =============================================================================
import { useMemo, useRef, useState } from 'react';
import { X, Link2, Copy, Check, Send, Star, ImageOff } from 'lucide-react';
import BotonImprimir from '../common/BotonImprimir';
import { useEmpresa, CabeceraEmpresa, CondicionesComerciales, colorMarcaDe } from '../../lib/empresa';
import { INVENTARIO_COBERTURAS } from './techosCadCatalog';
import { generarReportePresupuestoBom } from './techosCadCalculations';
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import { fotoPropuesta } from './fotoPropuesta';
import { safeStorage } from '../../lib/storageManager';
import { publicarPropuesta, claveValida, normalizarClave } from '../../lib/propuestas';
import { redactarConIA } from '../../lib/redaccionIA';
import { iaVisibleParaUI } from '../../lib/aiAccess';
import { Sparkles } from 'lucide-react';

export interface OpcionPropuesta { nombre: string; coberturaId: string; nota: string }

const K_OPCIONES = 'innova_propuesta_opciones';
const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function opcionesPorDefecto(actual?: string): OpcionPropuesta[] {
  const alu = INVENTARIO_COBERTURAS.filter(c => /aluzinc|calamina/.test(c.categoria)).sort((a, b) => a.costoM2Sol - b.costoM2Sol);
  const premium = INVENTARIO_COBERTURAS.find(c => c.categoria === 'panel_sandwich_pur') || [...INVENTARIO_COBERTURAS].sort((a, b) => b.costoM2Sol - a.costoM2Sol)[0];
  return [
    { nombre: 'Económica', coberturaId: alu[0]?.id || INVENTARIO_COBERTURAS[0].id, nota: 'Cumple y protege: la opción de menor inversión.' },
    { nombre: 'Estándar', coberturaId: actual || alu[Math.min(2, alu.length - 1)]?.id || INVENTARIO_COBERTURAS[0].id, nota: 'La más elegida: mejor espesor y durabilidad.' },
    { nombre: 'Premium', coberturaId: premium?.id || INVENTARIO_COBERTURAS[0].id, nota: 'Aislamiento térmico y acústico: más fresco y silencioso.' },
  ];
}

export default function PropuestaClienteView({
  nodes, segments, coverageZones, nombreProyecto, cliente, ubicacion, onClose,
}: {
  nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; coverageZones: Record<string, CoverageZone3D>;
  nombreProyecto: string; cliente: string; ubicacion: string; onClose: () => void;
}) {
  const { datos } = useEmpresa();
  const color = colorMarcaDe(datos);
  const hoja = useRef<HTMLDivElement>(null);
  const zonas = Object.values(coverageZones || {}).filter(z => !/^tq[0-9a-z]+_/.test(z.id));
  const actual = zonas[0]?.coberturaMaterialId;
  const [opciones, setOpcionesSt] = useState<OpcionPropuesta[]>(() => { const g = safeStorage.getItem<OpcionPropuesta[]>(K_OPCIONES, []) || []; return g.length === 3 ? g : opcionesPorDefecto(actual); });
  const setOpciones = (o: OpcionPropuesta[]) => { setOpcionesSt(o); safeStorage.setItem(K_OPCIONES, o); };
  const [recomendada, setRecomendada] = useState(1);
  const foto = fotoPropuesta();
  const [link, setLink] = useState<string | null>(null);
  const [claveCliente, setClaveCliente] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Carta de presentación (se escribe a mano o con IA) que va bajo la portada.
  const [carta, setCartaSt] = useState<string>(() => safeStorage.getItem<string>('innova_propuesta_carta', '') || '');
  const setCarta = (t: string) => { setCartaSt(t); safeStorage.setItem('innova_propuesta_carta', t); };
  const [redactando, setRedactando] = useState(false);

  // Precio de cada opción: el mismo techo con otra cobertura.
  const precios = useMemo(() => opciones.map(o => {
    const z: Record<string, CoverageZone3D> = {};
    Object.values(coverageZones || {}).forEach(x => { z[x.id] = /^tq[0-9a-z]+_/.test(x.id) ? x : { ...x, coberturaMaterialId: o.coberturaId }; });
    const r = generarReportePresupuestoBom(nodes, segments, z);
    const area = (r.resumenCoberturas || []).reduce((s, c) => s + (c.areaEfectivaCalculadaM2 || 0), 0);
    return { total: r.precioVentaFinalSoles, area };
  }), [opciones, nodes, segments, coverageZones]);
  const area = precios[0]?.area || 0;
  const nombreCob = (id: string) => INVENTARIO_COBERTURAS.find(c => c.id === id)?.nombre || id;
  const incluye = [
    `Estructura metálica completa: ${Object.values(segments).filter(s => s.rolEstructural === 'columna').length} columnas, vigas, tijerales y correas.`,
    `Cobertura de ${area.toFixed(1)} m² con pernos autoperforantes y cumbrera.`,
    'Placas base, pernos de anclaje, soldadura y pintura anticorrosiva.',
    'Fabricación, transporte y montaje con personal propio.',
  ];

  const redactar = async () => {
    setRedactando(true); setError(null);
    try {
      const t = await redactarConIA('propuesta', {
        empresa: datos.nombre, cliente, proyecto: nombreProyecto, ubicacion, areaM2: Math.round(area * 10) / 10,
        opciones: opciones.map((o, i) => ({ nombre: o.nombre, cobertura: nombreCob(o.coberturaId), precio: Math.round(precios[i]?.total || 0) })),
        incluye,
      });
      if (t) setCarta(t);
    } catch (e: any) { setError(e?.message || 'No se pudo redactar.'); }
    finally { setRedactando(false); }
  };

  const publicar = async () => {
    setPublicando(true); setError(null);
    try {
      const id = await publicarPropuesta({
        empresa: { nombre: datos.nombre, telefono: datos.telefono, ruc: datos.ruc, logo: datos.logo && datos.logo.length < 250000 ? datos.logo : '', color },
        proyecto: nombreProyecto, cliente, ubicacion,
        opciones: opciones.map((o, i) => ({ nombre: o.nombre, cobertura: nombreCob(o.coberturaId), nota: o.nota, total: precios[i]?.total || 0, recomendada: i === recomendada })),
        imagen: foto.despues || '', antes: foto.antes || '', carta,
        escena: { nodes, segments, coverageZones },
        incluye,
      }, claveCliente);
      setLink(`${window.location.origin}${window.location.pathname}?propuesta=${id}`);
    } catch (e: any) {
      setError(e?.message?.includes('demasiado') || e?.message?.includes('DNI') ? e.message : 'No se pudo publicar el link. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setPublicando(false); }
  };
  const copiar = async () => { if (!link) return; try { await navigator.clipboard.writeText(link); } catch { /* sin portapapeles */ } setCopiado(true); setTimeout(() => setCopiado(false), 1800); };
  const whatsapp = () => {
    if (!link) return;
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${encodeURIComponent(`Hola${cliente ? ' ' + cliente : ''}, te comparto la propuesta de tu techo (${nombreProyecto}). Puedes verlo en 3D, elegir una opción y aceptarla aquí: ${link} — Para abrirlo escribe tu ${normalizarClave(claveCliente).length === 9 ? 'número de celular' : 'DNI'}.`)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[85] bg-slate-900/70 flex items-stretch sm:items-center justify-center sm:p-3" onClick={onClose}>
      <div className="bg-slate-100 w-full sm:max-w-5xl sm:rounded-3xl shadow-2xl flex flex-col max-h-full sm:max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white sm:rounded-t-3xl border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900 mr-auto">Propuesta visual para el cliente</h3>
          <BotonImprimir objetivo={() => hoja.current} titulo={`Propuesta - ${nombreProyecto}`} etiqueta="PDF / Imprimir" />
          <input value={claveCliente} onChange={e => setClaveCliente(e.target.value)} inputMode="numeric" autoComplete="off"
            placeholder="DNI o celular del cliente" title="El cliente lo escribe para abrir el link (privacidad)"
            className={`w-[170px] px-2.5 py-2 rounded-xl border text-xs font-bold ${claveCliente && !claveValida(claveCliente) ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`} aria-label="DNI o celular del cliente" />
          <button onClick={publicar} disabled={publicando || !claveValida(claveCliente)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer disabled:opacity-50">
            <Link2 className="w-4 h-4" /> {publicando ? 'Publicando…' : link ? 'Actualizar link' : 'Link para el cliente'}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Cerrar"><X className="w-4 h-4" /></button>
          {(link || error) && (
            <div className="w-full flex flex-wrap items-center gap-2 text-xs">
              {error && <span className="font-bold text-rose-700">{error}</span>}
              {link && <>
                <input readOnly value={link} className="flex-1 min-w-[200px] px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]" />
                <button onClick={copiar} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold cursor-pointer">{copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}{copiado ? 'Copiado' : 'Copiar'}</button>
                <button onClick={whatsapp} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"><Send className="w-3.5 h-3.5" /> WhatsApp</button>
              </>}
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-3 sm:p-5">
          {/* Ajustes de las opciones (no se imprimen) */}
          <div className="no-imprimir mb-3 grid sm:grid-cols-3 gap-2">
            {opciones.map((o, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <input value={o.nombre} onChange={e => setOpciones(opciones.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} className="flex-1 px-2 py-1 rounded-lg bg-slate-50 text-xs font-black" />
                  <button onClick={() => setRecomendada(i)} title="Marcar como recomendada" className={`p-1 rounded-lg cursor-pointer ${recomendada === i ? 'text-amber-500' : 'text-slate-300'}`}><Star className="w-4 h-4" fill={recomendada === i ? 'currentColor' : 'none'} /></button>
                </div>
                <select value={o.coberturaId} onChange={e => setOpciones(opciones.map((x, j) => j === i ? { ...x, coberturaId: e.target.value } : x))} className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold">
                  {INVENTARIO_COBERTURAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <input value={o.nota} onChange={e => setOpciones(opciones.map((x, j) => j === i ? { ...x, nota: e.target.value } : x))} className="w-full px-2 py-1 rounded-lg bg-slate-50 text-[11px]" />
              </div>
            ))}
          </div>

          <div className="no-imprimir mb-3 bg-white rounded-xl border border-slate-200 p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black text-slate-700">Carta de presentación (opcional)</p>
              {iaVisibleParaUI() && <button onClick={redactar} disabled={redactando} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 text-amber-950 text-[11px] font-black cursor-pointer disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5" /> {redactando ? 'Redactando…' : 'Redactar con IA (2 créditos)'}
              </button>}
            </div>
            <textarea value={carta} onChange={e => setCarta(e.target.value)} rows={3} placeholder="Escribe unas líneas para tu cliente o deja que la IA las redacte."
              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs" />
          </div>

          <div ref={hoja} className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xl imprimir-claro">
            {/* PORTADA */}
            <div className="rounded-2xl p-5 text-white mb-5" style={{ background: color }}>
              <div className="flex items-center gap-3">
                {datos.logo && <img src={datos.logo} alt="" className="h-12 w-12 object-contain bg-white rounded-xl p-1" />}
                <div className="min-w-0">
                  <p className="text-xs font-bold opacity-90">{datos.nombre || 'Tu empresa'}{datos.telefono ? ` · Cel. ${datos.telefono}` : ''}</p>
                  <h1 className="text-2xl sm:text-3xl font-black leading-tight">Propuesta de techo metálico</h1>
                </div>
              </div>
              <p className="mt-2 text-sm font-bold opacity-95">{nombreProyecto}{cliente ? ` · Para: ${cliente}` : ''}{ubicacion ? ` · ${ubicacion}` : ''}</p>
              <p className="text-[11px] opacity-80">{new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {foto.despues ? (
              foto.antes ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <figure><img src={foto.antes} alt="Antes" className="w-full rounded-xl border border-slate-200" /><figcaption className="text-center text-xs font-black text-slate-500 mt-1">ANTES</figcaption></figure>
                  <figure><img src={foto.despues} alt="Después" className="w-full rounded-xl border border-slate-200" /><figcaption className="text-center text-xs font-black mt-1" style={{ color }}>DESPUÉS</figcaption></figure>
                </div>
              ) : <img src={foto.despues} alt="Techo en 3D" className="w-full rounded-xl border border-slate-200 mb-5" />
            ) : (
              <div className="no-imprimir mb-5 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 text-xs">
                <ImageOff className="w-6 h-6 mx-auto mb-1" /> Abre el <b>3D</b>, cubre el techo y toca <b>“Foto propuesta”</b> para poner aquí la imagen. Con <b>“Foto real”</b> sale el antes y después sobre la casa del cliente.
              </div>
            )}

            {carta.trim() && <div className="mb-5 text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">{carta}</div>}

            {/* OPCIONES */}
            <h2 className="text-sm font-black uppercase mb-2" style={{ color }}>Elige tu opción</h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {opciones.map((o, i) => (
                <div key={i} className="relative rounded-2xl border-2 p-4" style={{ borderColor: i === recomendada ? color : '#e2e8f0' }}>
                  {i === recomendada && <span className="absolute -top-2.5 left-3 text-[10px] font-black text-white rounded-full px-2 py-0.5" style={{ background: color }}>RECOMENDADA</span>}
                  <p className="text-xs font-black uppercase text-slate-500">Opción {String.fromCharCode(65 + i)}</p>
                  <p className="text-lg font-black leading-tight">{o.nombre}</p>
                  <p className="text-2xl font-black mt-1">{S(precios[i]?.total || 0)}</p>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">{nombreCob(o.coberturaId)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{o.nota}</p>
                </div>
              ))}
            </div>

            <h2 className="text-sm font-black uppercase mb-1.5" style={{ color }}>Incluye</h2>
            <ul className="text-xs text-slate-700 space-y-1 mb-2">{incluye.map(t => <li key={t}>✓ {t}</li>)}</ul>

            <CondicionesComerciales total={precios[recomendada]?.total || 0} />
            <div className="mt-4 text-[10px] text-slate-400 flex items-center justify-between gap-2"><CabeceraEmpresaMini /><span>Los precios de las opciones B y C se calculan con el mismo diseño cambiando la cobertura.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CabeceraEmpresaMini() {
  const { datos } = useEmpresa();
  if (!datos.nombre) return <span className="no-imprimir"><CabeceraEmpresa /></span>;
  return <span>{[datos.nombre, datos.ruc && `RUC ${datos.ruc}`, datos.direccion].filter(Boolean).join(' · ')}</span>;
}
