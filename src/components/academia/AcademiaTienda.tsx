// =============================================================================
// Academia técnica — TIENDA: portada, paquetes (varios cursos por un único precio),
// cursos con tarjetas llamativas y plantillas / recursos de la biblioteca.
// Comprar: en la web y la PC con Yape o Plin (captura → compra pendiente que el admin valida;
// al validar se habilita todo lo comprado). En la app de Android no se vende por fuera de
// Google Play: ahí todo se CANJEA con créditos (los mismos de las funciones inteligentes, que en
// Android se recargan con Google Play). En la web y la PC el canje es otra opción junto a Yape.
// Las clases se siguen viendo en "Mis clases" (UsabilidadVideosView).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  GraduationCap, PlayCircle, Lock, CheckCircle2, Clock, Package, Sparkles, FileText, Search, X, ShieldCheck,
  Smartphone, Download, Infinity as InfinityIcon, Layers, Plus, Pencil, Trash2, Star, ShoppingCart, BookOpen, Coins,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type { CourseCategory, TutorialVideo } from '../UsabilidadVideosView';
import type { BibliotecaItem } from '../BibliotecaPremiumView';
import { comprasPermitidas } from '../../lib/plataforma';
import { precioPEN } from '../../lib/currency';
import { leerPagoDirecto, pagoDirectoListo, nombreMediosPago, type ConfigPagoDirecto, type PedidoDirecto } from '../../lib/pagoDirecto';
import { escucharPaquetes, guardarPaquetes, ID_COMPRA_PAQUETE, type PaqueteAcademia } from '../../lib/paquetesAcademia';
import VentanaPagoDirecto from '../VentanaPagoDirecto';
import ConfirmarCanjeCreditos from '../ConfirmarCanjeCreditos';
import { useFactorCreditos, creditosDeCurso, creditosDeRecurso, creditosDePaquete, canjearCursoConCreditos, canjearRecursoConCreditos, canjearPaqueteConCreditos } from '../../lib/cursosCreditos';

const TEL_DUENO = '51966000500';
const tiene = (lista: string[] | undefined, uid?: string) => {
  if (!uid || !Array.isArray(lista)) return false;
  const base = uid.replace(/^user_/, '');
  return lista.some(x => x === uid || x === base || x === 'user_' + base);
};
const vigente = (iso?: string) => !iso || new Date(iso).getTime() > Date.now();
const precioCurso = (c: CourseCategory) => {
  const base = Number(c.priceSoles) || 0;
  const d = c.discountPercentage && vigente(c.discountExpiryDate) ? c.discountPercentage : 0;
  return { precio: Math.round(base * (1 - d / 100) * 100) / 100, antes: d ? base : (c.precioAntesSoles && c.precioAntesSoles > base ? c.precioAntesSoles : 0), d };
};
const precioRecurso = (r: BibliotecaItem) => {
  const base = Number(r.precioSoles) || 0;
  const d = r.discountPercentage && vigente(r.discountExpiryDate) ? r.discountPercentage : 0;
  return { precio: Math.round(base * (1 - d / 100) * 100) / 100, antes: d ? base : (r.precioOriginalSoles && r.precioOriginalSoles > base ? r.precioOriginalSoles : 0), d };
};
const GRADIENTES = ['from-indigo-600 to-violet-700', 'from-amber-500 to-orange-600', 'from-emerald-600 to-teal-700', 'from-sky-600 to-blue-700', 'from-rose-500 to-pink-600', 'from-slate-700 to-slate-900'];
const grad = (s: string) => GRADIENTES[[...s].reduce((a, ch) => a + ch.charCodeAt(0), 0) % GRADIENTES.length];
const COLOR_PAQ: Record<string, string> = {
  ambar: 'from-amber-500 to-orange-600', indigo: 'from-indigo-600 to-violet-700', esmeralda: 'from-emerald-600 to-teal-700', rosa: 'from-rose-500 to-pink-600',
};
const NOMBRE_PLANTILLA: Record<string, string> = { techos: 'Techos metálicos', carpimetal: 'Carpintería metálica', drywall: 'Drywall' };

interface Props {
  cursos: CourseCategory[]; tutoriales: TutorialVideo[]; biblioteca: BibliotecaItem[];
  currentUser?: any; isAdmin?: boolean;
  onVerCurso: (nombreCurso: string) => void; onIrRecursos: () => void;
  pestanas?: React.ReactNode;   // selector Tienda / Mis clases, integrado en la portada
}

export default function AcademiaTienda({ cursos, tutoriales, biblioteca, currentUser, isAdmin = false, onVerCurso, onIrRecursos, pestanas }: Props) {
  const uid: string | undefined = currentUser?.id;
  const vende = comprasPermitidas();
  useFactorCreditos();   // precio en créditos según la recarga más conveniente
  // Canje con créditos: para todo usuario (no el admin, que ya tiene todo), también en Android.
  const canjea = !isAdmin && !!uid;
  const [canje, setCanje] = useState<{ tipo: 'curso' | 'recurso' | 'paquete'; id: string; nombre: string; creditos: number } | null>(null);
  const ofrece = vende || canjea;   // se muestra el contenido de pago (con precio o con créditos)
  const [paquetes, setPaquetes] = useState<PaqueteAcademia[]>([]);
  const [cfgPago, setCfgPago] = useState<ConfigPagoDirecto | null>(null);
  const [pedido, setPedido] = useState<PedidoDirecto | null>(null);
  const [pendientes, setPendientes] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [detalle, setDetalle] = useState<CourseCategory | null>(null);
  const [editor, setEditor] = useState(false);
  // Mientras llegan los cursos de internet (la primera vez tardan unos segundos) se muestran tarjetas
  // "fantasma" con «Cargando cursos…» en vez del espacio vacío. Si en 15 s no llega nada, se avisa.
  const [esperaVencida, setEsperaVencida] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEsperaVencida(true), 15000); return () => clearTimeout(t); }, []);
  const cargandoCursos = cursos.length === 0 && !esperaVencida;

  useEffect(() => escucharPaquetes(setPaquetes), []);
  useEffect(() => { if (vende) leerPagoDirecto().then(setCfgPago); }, [vende]);
  const cargarPendientes = () => {
    if (!uid || isAdmin) return;
    if (import.meta.env.DEV && (window as any).__comprasAcademiaSimuladas) { setPendientes(new Set((window as any).__comprasAcademiaSimuladas)); return; }
    getDocs(query(collection(db, 'purchases'), where('userId', '==', uid)))
      .then(s => setPendientes(new Set(s.docs.map(d => d.data() as any).filter(p => p.status === 'pendiente').map(p => p.itemId))))
      .catch(() => {});
  };
  useEffect(cargarPendientes, [uid, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const tieneCurso = (c: CourseCategory) => isAdmin || c.isFree !== false || !(Number(c.priceSoles) > 0) || tiene(c.allowedUserIds, uid);
  const tieneRecurso = (r: BibliotecaItem) => isAdmin || r.isFree || (r.isFree !== false && !(Number(r.precioSoles) > 0)) || tiene(r.allowedUserIds, uid);
  // Plantillas y recursos que van con un curso (por el módulo de la plantilla o por palabras del nombre del curso).
  const MODULO_CURSO: Record<string, RegExp> = { techos: /nave|techo|tijeral|estructur|parab/i, carpimetal: /carpinter|puerta|port[oó]n|reja|baranda/i, drywall: /drywall/i };
  const plantillasDe = (c: CourseCategory) => {
    const palabras = c.name.toLowerCase().split(/[^a-záéíóúñ]+/).filter(w => w.length >= 6);
    return biblioteca.filter(r => r.tipo !== 'video' && (ofrece || tieneRecurso(r)) && (
      (r.plantilla && MODULO_CURSO[r.plantilla.modulo]?.test(c.name)) ||
      palabras.some(w => `${r.titulo} ${r.categoria}`.toLowerCase().includes(w))
    )).slice(0, 4);
  };
  // Cursos de pago con una clase gratis de muestra: en la app de Android se muestran (sin precio ni compra).
  const tieneMuestra = (c: CourseCategory) => tutoriales.some(v => v.category === c.name && v.isFree !== false);
  const clasesDe = (c: CourseCategory) => tutoriales.filter(v => v.category === c.name);
  const q = busca.trim().toLowerCase();
  const coincide = (...t: (string | undefined)[]) => !q || t.some(x => (x || '').toLowerCase().includes(q));

  // En Android no se vende por fuera de Google Play: el contenido de pago se canjea con créditos.
  const cursosVis = cursos.filter(c => (ofrece || tieneCurso(c) || tieneMuestra(c)) && coincide(c.name, c.description))
    .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || clasesDe(b).length - clasesDe(a).length);
  const recursosVis = biblioteca.filter(r => r.tipo !== 'video' && (ofrece || tieneRecurso(r)) && coincide(r.titulo, r.descripcion, r.categoria))
    .sort((a, b) => Number(!!b.plantilla) - Number(!!a.plantilla) || Number(!!b.isMasComprado) - Number(!!a.isMasComprado));
  const paquetesVis = ofrece ? paquetes.filter(p => (p.activo || isAdmin) && coincide(p.nombre, p.descripcion)) : [];

  const comprar = (itemId: string, itemName: string, amount: number) => {
    if (!vende) return;
    if (pagoDirectoListo(cfgPago)) { setPedido({ itemId, itemName, amount }); return; }
    const msg = `Hola, quiero comprar en la Academia técnica: "${itemName}" (${precioPEN(amount)}).\nMi usuario: ${currentUser?.name || ''} (${uid || ''}).`;
    window.open(`https://wa.me/${TEL_DUENO}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Precio en créditos (en Android reemplaza al precio en soles) y botón "Canjear".
  const Creditos = ({ n, grande }: { n: number; grande?: boolean }) => (
    <span className={`inline-flex items-center gap-1 font-black text-orange-600 ${grande ? 'text-2xl' : 'text-lg'}`}><Coins className={grande ? 'w-6 h-6' : 'w-4 h-4'} />{n}<span className="text-[11px] font-bold text-orange-500">créditos</span></span>
  );
  const pedirCanje = (tipo: 'curso' | 'recurso' | 'paquete', id: string, nombre: string, creditos: number) => { setDetalle(null); setCanje({ tipo, id, nombre, creditos }); };

  const sumaPaquete = (p: PaqueteAcademia) =>
    p.cursos.reduce((s, id) => s + (Number(cursos.find(c => c.id === id)?.priceSoles) || 0), 0) +
    p.recursos.reduce((s, id) => s + (Number(biblioteca.find(r => r.id === id)?.precioSoles) || 0), 0);
  const nClases = tutoriales.length, nCursos = cursos.length, nPlantillas = biblioteca.filter(r => r.plantilla).length;

  const tx = 'text-slate-900', sub = 'text-slate-500';

  const Insignia = ({ children, tono }: { children: React.ReactNode; tono: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm whitespace-nowrap shrink-0 ${tono}`}>{children}</span>
  );
  const Precio = ({ precio, antes, d }: { precio: number; antes: number; d: number }) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-lg font-black text-slate-900">{precioPEN(precio)}</span>
      {antes > precio && <span className="text-xs line-through text-slate-400">{precioPEN(antes)}</span>}
      {d > 0 && <span className="text-[10px] font-black text-rose-500">-{d}%</span>}
    </div>
  );

  return (
    <div className="w-full min-h-full pb-6 bg-slate-50">
      {/* PORTADA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        {pestanas && <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-4">{pestanas}</div>}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #6366f1 0, transparent 40%), radial-gradient(circle at 85% 70%, #f59e0b 0, transparent 35%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-10 sm:pt-8 sm:pb-12 grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold"><GraduationCap className="w-3.5 h-3.5 text-amber-300" />Academia técnica InnovApp</span>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black leading-tight">Aprende el oficio con <span className="text-amber-300">casos reales de obra</span></h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl">Cursos en video de estructuras metálicas, techos, carpintería y más, con planos, plantillas y material descargable. A tu ritmo, desde el celular o la PC.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {paquetesVis.length > 0 && <a href="#paquetes" className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black">Ver paquetes con descuento</a>}
              <a href="#cursos" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold">Explorar cursos</a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[[cargandoCursos ? '…' : nCursos, 'cursos'], [cargandoCursos ? '…' : nClases, 'clases en video'], [nPlantillas || recursosVis.length, nPlantillas ? 'plantillas' : 'recursos']].map(([n, t]) => (
              <div key={String(t)} className="rounded-[16px] ring-1 ring-white/10 p-3 sm:p-4 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: '#fff' }}>{n}</p><p className="text-[11px] font-bold" style={{ color: '#cbd5e1' }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative -mt-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {(vende
            ? [[InfinityIcon, 'Acceso permanente', 'Pagas una vez'], [Smartphone, 'Celular, web y PC', 'Con el mismo PIN'], [Download, 'Material descargable', 'Planos y PDF'], [ShieldCheck, 'Pago seguro', nombreMediosPago(cfgPago)]]
            // App de Android: nada que mencione pagos fuera de Google Play.
            : [[InfinityIcon, 'Acceso permanente', 'Para siempre'], [Smartphone, 'Celular, web y PC', 'Con el mismo PIN'], [Download, 'Material descargable', 'Planos y PDF'], [Coins, 'Canjea con créditos', 'Cursos y plantillas']]).map(([Ic, t, d]: any) => (
            <div key={t} className="rounded-xl p-3 flex items-center gap-2.5 bg-white border border-slate-200 shadow-sm">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600"><Ic className="w-4.5 h-4.5" /></span>
              <span className="min-w-0"><span className={`block text-xs font-black ${tx}`}>{t}</span><span className={`block text-[10px] ${sub}`}>{d}</span></span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">
        {/* Buscador + admin */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cursos, paquetes o plantillas…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:border-indigo-400 focus:outline-none border-slate-200 bg-white" />
          </div>
          {isAdmin && <button onClick={() => setEditor(true)} className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"><Package className="w-4 h-4" />Gestionar paquetes</button>}
        </div>

        {/* PAQUETES */}
        {paquetesVis.length > 0 && (
          <section id="paquetes" className="space-y-3">
            <div><h2 className={`text-lg sm:text-xl font-black ${tx} flex items-center gap-2`}><Package className="w-5 h-5 text-amber-500" />Paquetes con descuento</h2>
              <p className={`text-xs ${sub}`}>Varios cursos y plantillas por un único precio.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paquetesVis.map(p => {
                const suma = sumaPaquete(p), ahorro = Math.max(0, suma - p.precioSoles), pct = suma ? Math.round((ahorro / suma) * 100) : 0;
                const cs = p.cursos.map(id => cursos.find(c => c.id === id)).filter(Boolean) as CourseCategory[];
                const rs = p.recursos.map(id => biblioteca.find(r => r.id === id)).filter(Boolean) as BibliotecaItem[];
                const todo = cs.every(tieneCurso) && rs.every(tieneRecurso) && (cs.length + rs.length) > 0;
                const enRevision = pendientes.has(ID_COMPRA_PAQUETE(p.id));
                return (
                  <article key={p.id} className={`relative min-w-0 rounded-2xl p-[2px] bg-gradient-to-br ${COLOR_PAQ[p.color || 'indigo'] || COLOR_PAQ.indigo} shadow-lg ${!p.activo ? 'opacity-60' : ''}`}>
                    <div className="h-full min-w-0 rounded-[14px] bg-white p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-slate-900 leading-snug">{p.nombre}</h3>
                        {p.destacado && <Insignia tono="bg-amber-400 text-slate-950"><Star className="w-3 h-3" />Más vendido</Insignia>}
                      </div>
                      {!p.activo && <span className="text-[10px] font-black text-slate-500">Oculto para los usuarios</span>}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.descripcion}</p>
                      <ul className="mt-3 space-y-1.5 flex-1">
                        {cs.map(c => (
                          <li key={c.id} className="flex items-center gap-2 text-xs min-w-0">
                            {c.portadaUrl ? <img src={c.portadaUrl} alt="" className="w-10 h-7 rounded object-cover shrink-0" /> : <span className={`w-10 h-7 rounded bg-gradient-to-br ${grad(c.name)} shrink-0`} />}
                            <span className="font-bold text-slate-800 truncate flex-1 min-w-0">{c.name}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{clasesDe(c).length} clases</span>
                          </li>
                        ))}
                        {rs.length > 0 && <li className="flex items-center gap-2 text-xs text-slate-600"><FileText className="w-4 h-4 text-emerald-600" /><span className="font-bold">+ {rs.length} plantilla{rs.length > 1 ? 's' : ''} y recursos</span></li>}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            {vende ? (<>
                              {suma > p.precioSoles && <span className="block text-[11px] text-slate-400">Por separado <span className="line-through">{precioPEN(suma)}</span></span>}
                              <span className="text-2xl font-black text-slate-900">{precioPEN(p.precioSoles)}</span>
                              {canjea && <span className="block text-[11px] font-bold text-orange-600">o {creditosDePaquete(p)} créditos</span>}
                            </>) : <Creditos n={creditosDePaquete(p)} grande />}
                          </div>
                          {pct > 0 && <Insignia tono="bg-emerald-100 text-emerald-700">Ahorras {pct}%</Insignia>}
                        </div>
                        {todo ? <div className="mt-2 w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black text-center flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" />Ya tienes todo el paquete</div>
                          : enRevision ? <div className="mt-2 w-full py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-black text-center flex items-center justify-center gap-1"><Clock className="w-4 h-4" />Pago en revisión</div>
                          : <>
                            {vende && <button onClick={() => comprar(ID_COMPRA_PAQUETE(p.id), `Paquete: ${p.nombre}`, p.precioSoles)} className={`mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r ${COLOR_PAQ[p.color || 'indigo'] || COLOR_PAQ.indigo} text-white text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110`}><ShoppingCart className="w-4 h-4" />Comprar paquete</button>}
                            {canjea && <button onClick={() => pedirCanje('paquete', p.id, p.nombre, creditosDePaquete(p))} className={`mt-2 w-full rounded-xl text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer ${vende ? 'py-2 bg-orange-50 text-orange-700 hover:bg-orange-100' : `py-2.5 bg-gradient-to-r ${COLOR_PAQ[p.color || 'indigo'] || COLOR_PAQ.indigo} text-white hover:brightness-110`}`}><Coins className="w-4 h-4" />Canjear con {creditosDePaquete(p)} créditos</button>}
                          </>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* CURSOS */}
        <section id="cursos" className="space-y-3">
          <div><h2 className={`text-lg sm:text-xl font-black ${tx} flex items-center gap-2`}><PlayCircle className="w-5 h-5 text-indigo-600" />Cursos</h2>
            <p className={`text-xs ${sub}`}>Toca un curso para ver sus clases y su material.</p></div>
          {cargandoCursos ? (
            <div aria-busy="true">
              <p className="text-sm font-black text-indigo-700 flex items-center gap-2 mb-3"><span className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />Cargando cursos…</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-slate-200" />
                    <div className="p-4 space-y-2.5"><div className="h-4 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-full" /><div className="h-3 bg-slate-100 rounded w-2/3" /><div className="h-5 bg-slate-200 rounded w-1/3 mt-3" /></div>
                  </div>
                ))}
              </div>
            </div>
          ) : cursosVis.length === 0 ? <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-6 text-center">{cursos.length ? 'No hay cursos que coincidan.' : 'Todavía no hay cursos. Revisa tu conexión a internet o vuelve a entrar en un momento.'}</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursosVis.map(c => {
                const cl = clasesDe(c), acceso = tieneCurso(c), pr = precioCurso(c), gratis = c.isFree !== false || !(Number(c.priceSoles) > 0);
                const enRevision = pendientes.has(c.id) || pendientes.has(c.name);
                return (
                  <article key={c.id} onClick={() => setDetalle(c)} className="group min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                      {c.portadaUrl ? <img src={c.portadaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className={`w-full h-full bg-gradient-to-br ${grad(c.name)} flex items-center justify-center`}><GraduationCap className="w-12 h-12 text-white/80" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {c.isFeatured && <Insignia tono="bg-amber-400 text-slate-950"><Star className="w-3 h-3" />Destacado</Insignia>}
                        {gratis ? <Insignia tono="bg-emerald-500 text-white">Gratis</Insignia> : vende && pr.d > 0 ? <Insignia tono="bg-rose-600 text-white">-{pr.d}%</Insignia> : null}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
                        <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" />{cl.length} clase{cl.length === 1 ? '' : 's'}</span>
                        {!!c.adjuntos?.length && <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{c.adjuntos.length} material{c.adjuntos.length === 1 ? '' : 'es'}</span>}
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl"><PlayCircle className="w-8 h-8 text-indigo-600" /></span></span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-black text-slate-900 leading-snug line-clamp-2">{c.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{c.description || 'Curso práctico de la Academia técnica.'}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {acceso ? <span className="text-xs font-black text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{gratis ? 'Acceso libre' : 'Tienes acceso'}</span>
                          : enRevision ? <span className="text-xs font-black text-amber-700 flex items-center gap-1"><Clock className="w-4 h-4" />Pago en revisión</span>
                          : !vende ? (canjea ? <Creditos n={creditosDeCurso(c)} /> : <span className="text-xs font-black text-indigo-700 flex items-center gap-1"><PlayCircle className="w-4 h-4" />Clase de muestra gratis</span>)
                          : <Precio {...pr} />}
                        <span className="text-xs font-black text-indigo-600 group-hover:underline">{acceso ? 'Entrar →' : 'Ver curso →'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* PLANTILLAS Y RECURSOS */}
        {recursosVis.length > 0 && (
          <section id="plantillas" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><h2 className={`text-lg sm:text-xl font-black ${tx} flex items-center gap-2`}><Layers className="w-5 h-5 text-emerald-600" />Plantillas y recursos</h2>
                <p className={`text-xs ${sub}`}>Diseños listos para cargar en el programa, planos y libros técnicos.</p></div>
              <button onClick={onIrRecursos} className="text-xs font-black text-emerald-700 hover:underline cursor-pointer">Ver mis plantillas →</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recursosVis.slice(0, 12).map(r => {
                const acceso = tieneRecurso(r), pr = precioRecurso(r), enRevision = pendientes.has(r.id);
                return (
                  <article key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {r.previewImageUrl ? <img src={r.previewImageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className={`w-full h-full bg-gradient-to-br ${r.plantilla ? 'from-emerald-500 to-teal-700' : 'from-slate-500 to-slate-700'} flex items-center justify-center`}>{r.plantilla ? <Layers className="w-10 h-10 text-white/80" /> : <BookOpen className="w-10 h-10 text-white/80" />}</div>}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        {r.plantilla && <Insignia tono="bg-emerald-600 text-white">Plantilla · {NOMBRE_PLANTILLA[r.plantilla.modulo] || r.plantilla.modulo}</Insignia>}
                        {r.isMasComprado && <Insignia tono="bg-amber-400 text-slate-950">Más comprado</Insignia>}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{r.categoria}</span>
                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 flex-1">{r.titulo}</h3>
                      <div className="mt-2">
                        {acceso ? <button onClick={onIrRecursos} className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black cursor-pointer flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Abrir</button>
                          : enRevision ? <div className="w-full py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-black text-center">En revisión</div>
                          : <div className="flex items-center justify-between gap-1">{vende ? <Precio {...pr} /> : <Creditos n={creditosDeRecurso(r)} />}
                            <span className="flex gap-1 shrink-0">
                              {vende && <button onClick={() => comprar(r.id, r.titulo, pr.precio)} className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" title="Comprar"><ShoppingCart className="w-4 h-4" /></button>}
                              {canjea && <button onClick={() => pedirCanje('recurso', r.id, r.titulo, creditosDeRecurso(r))} className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer" title={`Canjear con ${creditosDeRecurso(r)} créditos`} aria-label="Canjear con créditos"><Coins className="w-4 h-4" /></button>}
                            </span></div>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* App de Android: sin textos que inviten a comprar por fuera de Google Play (política de pagos). */}
      </div>

      {/* DETALLE DEL CURSO */}
      {detalle && (() => {
        const c = detalle, cl = clasesDe(c), acceso = tieneCurso(c), pr = precioCurso(c), enRevision = pendientes.has(c.id) || pendientes.has(c.name);
        return (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetalle(null)}>
            <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="relative aspect-[21/9] shrink-0">
                {c.portadaUrl ? <img src={c.portadaUrl} alt="" className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${grad(c.name)}`} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button onClick={() => setDetalle(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
                <div className="absolute bottom-3 left-4 right-4 text-white"><h2 className="text-xl font-black leading-tight">{c.name}</h2>
                  <p className="text-xs text-white/80">{cl.length} clases{c.adjuntos?.length ? ` · ${c.adjuntos.length} materiales descargables` : ''}</p></div>
              </div>
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {c.description && <p className="text-sm text-slate-600 whitespace-pre-line">{c.description}</p>}
                <div>
                  <p className="text-xs font-black text-slate-800 mb-2">Contenido del curso</p>
                  <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {cl.length ? cl.map((v, i) => {
                      const libre = acceso || v.isFree !== false && c.isFree !== false;
                      return (
                        <li key={v.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="flex-1 min-w-0 truncate font-semibold text-slate-800">{v.title.replace(/^\d+[.)]\s*/, '')}</span>
                          {libre ? <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" /> : <Lock className="w-4 h-4 text-slate-400 shrink-0" />}
                        </li>
                      );
                    }) : <li className="px-3 py-3 text-xs text-slate-500">Pronto se publicarán sus clases.</li>}
                  </ol>
                </div>
                {plantillasDe(c).length > 0 && (
                  <div><p className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5"><Layers className="w-4 h-4 text-emerald-600" />Practica con estas plantillas</p>
                    <div className="grid sm:grid-cols-2 gap-2">{plantillasDe(c).map(r => {
                      const acc = tieneRecurso(r), prr = precioRecurso(r), rev = pendientes.has(r.id);
                      return (
                        <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl border border-emerald-200 bg-emerald-50/50">
                          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0">{r.plantilla ? <Layers className="w-4 h-4" /> : <FileText className="w-4 h-4" />}</span>
                          <span className="flex-1 min-w-0"><span className="block text-xs font-black text-slate-800 truncate">{r.titulo}</span>
                            <span className="block text-[10px] text-slate-500">{acc ? 'Ya la tienes' : rev ? 'Pago en revisión' : vende ? precioPEN(prr.precio) : `${creditosDeRecurso(r)} créditos`}</span></span>
                          {acc ? <button onClick={() => { setDetalle(null); onIrRecursos(); }} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black cursor-pointer">Abrir</button>
                            : !rev && vende ? <button onClick={() => { setDetalle(null); comprar(r.id, r.titulo, prr.precio); }} className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer" title="Comprar"><ShoppingCart className="w-3.5 h-3.5" /></button>
                            : !rev && canjea ? <button onClick={() => pedirCanje('recurso', r.id, r.titulo, creditosDeRecurso(r))} className="p-1.5 rounded-lg bg-orange-500 text-white cursor-pointer" title="Canjear con créditos" aria-label="Canjear con créditos"><Coins className="w-3.5 h-3.5" /></button> : null}
                        </div>
                      );
                    })}</div></div>
                )}
                {!!c.adjuntos?.length && (
                  <div><p className="text-xs font-black text-slate-800 mb-2">Material incluido</p>
                    <div className="flex flex-wrap gap-1.5">{c.adjuntos.map(a => <span key={a.url} className="px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1">{acceso ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{a.nombre}</span>)}</div></div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {acceso ? <span className="text-sm font-black text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-5 h-5" />Tienes acceso</span>
                    : enRevision ? <span className="text-sm font-black text-amber-700 flex items-center gap-1"><Clock className="w-5 h-5" />Pago en revisión</span>
                    : !vende ? (canjea ? <Creditos n={creditosDeCurso(c)} /> : <span className="text-sm font-black text-indigo-700 flex items-center gap-1"><PlayCircle className="w-5 h-5" />Clase de muestra gratis</span>)
                    : <div><Precio {...pr} />{canjea && <span className="block text-[11px] font-bold text-orange-600">o {creditosDeCurso(c)} créditos</span>}</div>}
                  {acceso ? <button onClick={() => { setDetalle(null); onVerCurso(c.name); }} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer flex items-center gap-1.5"><PlayCircle className="w-4 h-4" />Ir a las clases</button>
                    : vende && !enRevision ? <button onClick={() => { setDetalle(null); comprar(c.id, c.name, pr.precio); }} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" />Comprar curso</button>
                    : !canjea && tieneMuestra(c) ? <button onClick={() => { setDetalle(null); onVerCurso(c.name); }} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer flex items-center gap-1.5"><PlayCircle className="w-4 h-4" />Ver clase gratis</button>
                    : !vende && canjea && !enRevision ? <button onClick={() => pedirCanje('curso', c.id, c.name, creditosDeCurso(c))} className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black cursor-pointer flex items-center gap-1.5"><Coins className="w-4 h-4" />Canjear créditos</button> : null}
                </div>
                {!acceso && !enRevision && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {canjea && vende && <button onClick={() => pedirCanje('curso', c.id, c.name, creditosDeCurso(c))} className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-black cursor-pointer flex items-center gap-1.5"><Coins className="w-4 h-4" />Canjear con {creditosDeCurso(c)} créditos</button>}
                    {canjea && tieneMuestra(c) && <button onClick={() => { setDetalle(null); onVerCurso(c.name); }} className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black cursor-pointer flex items-center gap-1.5"><PlayCircle className="w-4 h-4" />Ver clase gratis</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {pedido && cfgPago && <VentanaPagoDirecto cfg={cfgPago} pedido={pedido} onClose={() => setPedido(null)} onEnviado={() => { setPendientes(s => new Set([...s, pedido.itemId])); setTimeout(cargarPendientes, 1500); }} />}
      {canje && <ConfirmarCanjeCreditos tipo={canje.tipo} nombre={canje.nombre} creditos={canje.creditos} onCerrar={() => setCanje(null)}
        onCanjear={() => canje.tipo === 'curso' ? canjearCursoConCreditos(canje.id) : canje.tipo === 'recurso' ? canjearRecursoConCreditos(canje.id) : canjearPaqueteConCreditos(canje.id)} />}
      {editor && <EditorPaquetes paquetes={paquetes} cursos={cursos} biblioteca={biblioteca} onClose={() => setEditor(false)} />}
    </div>
  );
}

/** Editor de paquetes (solo admin). */
function EditorPaquetes({ paquetes, cursos, biblioteca, onClose }: { paquetes: PaqueteAcademia[]; cursos: CourseCategory[]; biblioteca: BibliotecaItem[]; onClose: () => void }) {
  const vacio = (): PaqueteAcademia => ({ id: Date.now().toString(36), nombre: '', descripcion: '', cursos: [], recursos: [], precioSoles: 0, activo: true, color: 'indigo', creado: new Date().toISOString() });
  const [edit, setEdit] = useState<PaqueteAcademia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const pagados = useMemo(() => cursos.filter(c => c.isFree === false && Number(c.priceSoles) > 0), [cursos]);
  const recPagados = useMemo(() => biblioteca.filter(r => r.tipo !== 'video' && !r.isFree && Number(r.precioSoles) > 0), [biblioteca]);
  const suma = (p: PaqueteAcademia) => p.cursos.reduce((s, id) => s + (Number(cursos.find(c => c.id === id)?.priceSoles) || 0), 0) + p.recursos.reduce((s, id) => s + (Number(biblioteca.find(r => r.id === id)?.precioSoles) || 0), 0);
  const alternar = (lista: string[], id: string) => lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
  const guardar = async (lista: PaqueteAcademia[]) => { setGuardando(true); try { await guardarPaquetes(lista); setEdit(null); } catch (e: any) { alert('No se pudo guardar: ' + (e?.message || e)); } finally { setGuardando(false); } };
  const listo = edit && edit.nombre.trim() && edit.precioSoles > 0 && (edit.cursos.length + edit.recursos.length) >= 2;
  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/60 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="text-base font-black text-slate-900 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" />Paquetes de la Academia</h3>
            <p className="text-xs text-slate-500">Junta cursos y plantillas de pago y ponles un precio único. Al validar la compra se habilita todo.</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {!edit && (
            <>
              <button onClick={() => setEdit(vacio())} className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-700 text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-50"><Plus className="w-4 h-4" />Nuevo paquete</button>
              {paquetes.length === 0 && <p className="text-xs text-slate-500 text-center">Aún no hay paquetes.</p>}
              {paquetes.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate">{p.nombre} {!p.activo && <span className="text-[10px] text-slate-400">(oculto)</span>}</p>
                    <p className="text-[11px] text-slate-500">{p.cursos.length} cursos · {p.recursos.length} recursos · {precioPEN(p.precioSoles)} (por separado {precioPEN(suma(p))})</p>
                  </div>
                  <button onClick={() => setEdit({ ...p })} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer" title="Editar"><Pencil className="w-4 h-4 text-slate-600" /></button>
                  <button onClick={() => confirm(`¿Borrar el paquete "${p.nombre}"? Quien ya lo compró conserva su acceso.`) && guardar(paquetes.filter(x => x.id !== p.id))} className="p-2 rounded-lg hover:bg-rose-50 cursor-pointer" title="Borrar"><Trash2 className="w-4 h-4 text-rose-600" /></button>
                </div>
              ))}
            </>
          )}
          {edit && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Nombre<input value={edit.nombre} onChange={e => setEdit({ ...edit, nombre: e.target.value })} placeholder="Ej. Paquete Maestro Estructurista" className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></label>
              <label className="block text-xs font-bold text-slate-700">Descripción<textarea value={edit.descripcion} onChange={e => setEdit({ ...edit, descripcion: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></label>
              <div>
                <p className="text-xs font-black text-slate-800 mb-1.5">Cursos de pago incluidos ({edit.cursos.length})</p>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {pagados.map(c => (
                    <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${edit.cursos.includes(c.id) ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                      <input type="checkbox" checked={edit.cursos.includes(c.id)} onChange={() => setEdit({ ...edit, cursos: alternar(edit.cursos, c.id) })} className="accent-indigo-600" />
                      <span className="flex-1 font-bold truncate">{c.name}</span><span className="text-slate-500">{precioPEN(Number(c.priceSoles) || 0)}</span>
                    </label>
                  ))}
                  {!pagados.length && <p className="text-[11px] text-slate-500">No hay cursos de pago.</p>}
                </div>
              </div>
              {recPagados.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-800 mb-1.5">Plantillas y recursos incluidos ({edit.recursos.length})</p>
                  <div className="grid sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {recPagados.map(r => (
                      <label key={r.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${edit.recursos.includes(r.id) ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                        <input type="checkbox" checked={edit.recursos.includes(r.id)} onChange={() => setEdit({ ...edit, recursos: alternar(edit.recursos, r.id) })} className="accent-emerald-600" />
                        <span className="flex-1 font-bold truncate">{r.plantilla ? '📐 ' : ''}{r.titulo}</span><span className="text-slate-500">{precioPEN(Number(r.precioSoles) || 0)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-3 gap-2 items-end">
                <label className="block text-xs font-bold text-slate-700">Precio del paquete (S/)
                  <input type="number" min={0} step={0.1} value={edit.precioSoles || ''} onChange={e => setEdit({ ...edit, precioSoles: Number(e.target.value) || 0 })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-black" /></label>
                <div className="text-xs text-slate-600 pb-2">Por separado: <b>{precioPEN(suma(edit))}</b>{suma(edit) > edit.precioSoles && edit.precioSoles > 0 && <span className="text-emerald-700 font-black"> · ahorran {Math.round((1 - edit.precioSoles / suma(edit)) * 100)}%</span>}</div>
                <div className="flex gap-1">
                  {(['indigo', 'ambar', 'esmeralda', 'rosa'] as const).map(col => <button key={col} onClick={() => setEdit({ ...edit, color: col })} className={`flex-1 h-8 rounded-lg bg-gradient-to-br ${COLOR_PAQ[col]} cursor-pointer ${edit.color === col ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`} title={col} />)}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!edit.destacado} onChange={e => setEdit({ ...edit, destacado: e.target.checked })} className="accent-amber-500" />Marcar "Más vendido"</label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={edit.activo} onChange={e => setEdit({ ...edit, activo: e.target.checked })} className="accent-emerald-600" />Visible para los usuarios</label>
              </div>
              {!listo && <p className="text-[11px] text-amber-700 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Ponle nombre, precio y al menos 2 cursos o recursos.</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEdit(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold cursor-pointer">Cancelar</button>
                <button disabled={!listo || guardando} onClick={() => guardar(paquetes.some(p => p.id === edit.id) ? paquetes.map(p => p.id === edit.id ? edit : p) : [...paquetes, edit])}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black disabled:opacity-40 cursor-pointer">{guardando ? 'Guardando…' : 'Guardar paquete'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
