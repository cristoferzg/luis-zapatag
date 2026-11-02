// =============================================================================
// Página pública de una propuesta (?propuesta=<id>): el cliente, sin PIN, ve su
// techo en 3D, compara las opciones, elige una y la acepta con su nombre.
// Para verla escribe su DNI o celular (la propuesta va cifrada con ese dato).
// =============================================================================
import { lazy, Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Send, Loader2, Lock, FileSignature, ShieldCheck } from 'lucide-react';
import { leerPropuesta, aceptarPropuesta, abrirPropuesta, claveValida, PropuestaPublica, PropuestaBloqueada } from '../lib/propuestas';
import { clausulasContrato } from '../lib/contratoPropuesta';

const TechosViewer3D = lazy(() => import('./techos/TechosViewer3D').then(m => ({ default: m.TechosViewer3D })));
const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PropuestaPublicaView({ id }: { id: string }) {
  const [p, setP] = useState<PropuestaPublica | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'bloqueada' | 'no_existe' | 'error'>('cargando');
  const [bloq, setBloq] = useState<PropuestaBloqueada | null>(null);
  const [clave, setClave] = useState('');
  const [abriendo, setAbriendo] = useState(false);
  const [claveMal, setClaveMal] = useState(false);
  const [elegida, setElegida] = useState(0);
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ver3d, setVer3d] = useState(false);
  const [verContrato, setVerContrato] = useState(false);
  const [leyoContrato, setLeyoContrato] = useState(false);
  // Protección contra capturas: se tapa la propuesta al salir de la página (cambiar de
  // app, recortes de pantalla que roban el foco) o al pulsar Impr Pant. No se puede
  // copiar, guardar imágenes ni imprimir. Ninguna web puede impedir del todo una
  // captura del celular: por eso todo lleva una marca de agua con el nombre y DNI del cliente.
  const [tapado, setTapado] = useState(false);
  useEffect(() => {
    if (estado !== 'ok') return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const tapar = (ms = 0) => { setTapado(true); if (t) clearTimeout(t); if (ms) t = setTimeout(() => setTapado(false), ms); };
    const destapar = () => { if (t) clearTimeout(t); t = setTimeout(() => setTapado(false), 250); };
    const vis = () => (document.hidden ? tapar() : destapar());
    const no = (e: Event) => e.preventDefault();
    const teclas = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'printscreen') { tapar(2500); try { navigator.clipboard?.writeText(''); } catch { /* sin permiso */ } }
      if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's' || k === 'c' || (e.shiftKey && (k === 's' || k === '3' || k === '4' || k === '5')))) { e.preventDefault(); tapar(1500); }
    };
    document.addEventListener('visibilitychange', vis);
    const alSalir = () => tapar();
    window.addEventListener('blur', alSalir);
    window.addEventListener('focus', destapar);
    document.addEventListener('contextmenu', no);
    document.addEventListener('copy', no);
    document.addEventListener('dragstart', no);
    window.addEventListener('keydown', teclas);
    window.addEventListener('keyup', teclas);
    return () => {
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('blur', alSalir); window.removeEventListener('focus', destapar);
      document.removeEventListener('contextmenu', no); document.removeEventListener('copy', no); document.removeEventListener('dragstart', no);
      window.removeEventListener('keydown', teclas); window.removeEventListener('keyup', teclas);
    };
  }, [estado]);

  useEffect(() => {
    leerPropuesta(id).then(async d => {
      if (!d) { setEstado('no_existe'); return; }
      if ('bloqueada' in d) {
        setBloq(d); document.title = `Propuesta · ${d.empresa.nombre || 'privada'}`;
        // Si ya la abrió en esta pestaña, no se le vuelve a pedir el dato.
        let guardada = ''; try { guardada = sessionStorage.getItem(`innova_prop_${id}`) || ''; } catch { /* sin almacenamiento */ }
        const ab = guardada ? await abrirPropuesta(d, guardada) : null;
        if (ab) mostrar(ab); else setEstado('bloqueada');
        return;
      }
      mostrar(d);
    }).catch(() => setEstado('error'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mostrar = (d: PropuestaPublica) => {
    setP(d); setEstado('ok');
    setVer3d(!d.imagen && Object.keys(d.escena?.nodes || {}).length > 0); // sin foto: el 3D se ve directo
    setElegida(d.aceptadaOpcion ?? Math.max(0, d.opciones.findIndex(o => o.recomendada)));
    document.title = `Propuesta · ${d.proyecto}`;
  };
  const desbloquear = async () => {
    if (!bloq || !claveValida(clave)) return;
    setAbriendo(true); setClaveMal(false);
    const d = await abrirPropuesta(bloq, clave);
    setAbriendo(false);
    if (!d) { setClaveMal(true); return; }
    try { sessionStorage.setItem(`innova_prop_${id}`, clave); } catch { /* sin almacenamiento */ }
    mostrar(d);
  };

  if (estado === 'cargando') return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando propuesta…</div>;
  if (estado === 'bloqueada' && bloq) {
    const c = bloq.empresa.color || '#f59e0b';
    const que = bloq.pista === 'dni' ? 'tu DNI' : bloq.pista === 'celular' ? 'tu número de celular' : 'tu DNI o celular';
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 text-white flex items-center gap-3" style={{ background: c }}>
            {bloq.empresa.logo && <img src={bloq.empresa.logo} alt="" className="h-12 w-12 object-contain bg-white rounded-xl p-1" />}
            <div className="min-w-0">
              <p className="text-xs font-bold opacity-90">{bloq.empresa.nombre || 'Tu proveedor'}</p>
              <h1 className="text-lg font-black leading-tight">Tu propuesta de techo</h1>
            </div>
          </div>
          <form className="p-5 space-y-3" onSubmit={e => { e.preventDefault(); desbloquear(); }}>
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: c }} />
              <p>Esta propuesta es privada. Para verla escribe <b>{que}</b>.</p>
            </div>
            <input value={clave} onChange={e => { setClave(e.target.value); setClaveMal(false); }} inputMode="numeric" autoComplete="off" autoFocus
              placeholder={bloq.pista === 'dni' ? 'DNI (8 dígitos)' : bloq.pista === 'celular' ? 'Celular (9 dígitos)' : 'DNI o celular'}
              className={`w-full px-3 py-3 rounded-xl border text-center text-lg font-black tracking-widest ${claveMal ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} aria-label="DNI o celular" />
            {claveMal && <p className="text-xs font-bold text-rose-600 text-center">El dato no coincide. Revísalo e inténtalo otra vez.</p>}
            <button type="submit" disabled={!claveValida(clave) || abriendo} className="w-full py-3 rounded-xl text-white text-sm font-black cursor-pointer disabled:opacity-40" style={{ background: c }}>
              {abriendo ? 'Abriendo…' : 'Ver mi propuesta'}
            </button>
            <p className="text-[10px] text-slate-400 text-center">Solo tú puedes abrirla: la propuesta va protegida con tu dato y nadie más la ve, aunque tenga el link.</p>
          </form>
        </div>
      </div>
    );
  }
  if (estado !== 'ok' || !p) return <div className="min-h-screen flex items-center justify-center p-6 text-center text-slate-600">{estado === 'no_existe' ? 'Esta propuesta ya no está disponible. Pide un nuevo link a tu proveedor.' : 'No se pudo abrir la propuesta. Revisa tu conexión.'}</div>;

  const color = p.empresa.color || '#f59e0b';
  const aceptada = p.estado === 'aceptada';
  const hay3d = Object.keys(p.escena?.nodes || {}).length > 0;
  const aceptar = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    try { await aceptarPropuesta(id, elegida, nombre.trim()); setP({ ...p, estado: 'aceptada', aceptadaOpcion: elegida, aceptadaNombre: nombre.trim(), aceptadaEn: new Date().toISOString() }); }
    catch { alert('No se pudo enviar. Inténtalo de nuevo.'); }
    finally { setEnviando(false); }
  };
  const avisar = () => {
    const tel = (p.empresa.telefono || '').replace(/\D/g, '');
    const o = p.opciones[p.aceptadaOpcion ?? elegida];
    const a = document.createElement('a');
    a.href = `https://wa.me/${tel.length === 9 ? '51' + tel : tel}?text=${encodeURIComponent(`Hola ${p.empresa.nombre}, acepté la propuesta "${p.proyecto}" — opción ${o?.nombre} (${S(o?.total || 0)}). Soy ${p.aceptadaNombre || nombre}.`)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Marca de agua con el nombre y DNI del cliente (encima de todo, incluido el 3D).
  const quien = p.datosCliente?.nombre || p.cliente || 'Cliente';
  const dniMarca = p.datosCliente?.dni ? ` · DNI ••••${p.datosCliente.dni.slice(-3)}` : '';
  const textoMarca = `${quien}${dniMarca} · ${new Date().toLocaleDateString('es-PE')} · CONFIDENCIAL`.replace(/[<>&"]/g, '');
  const marcaSvg = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='340' height='200'><text x='10' y='120' transform='rotate(-28 170 100)' fill='%23334155' fill-opacity='0.13' font-family='Arial' font-size='15' font-weight='700'>${textoMarca}</text></svg>`).replace(/%2523/g, '%23')}")`;
  const contrato = p.contrato ? clausulasContrato(p.contrato, {
    cliente: p.datosCliente?.nombre || p.cliente, dni: p.datosCliente?.dni, direccion: p.datosCliente?.direccion, proyecto: p.proyecto, ubicacion: p.ubicacion,
    total: p.opciones[elegida]?.total || 0, opcion: p.opciones[elegida]?.nombre || '', cobertura: p.opciones[elegida]?.cobertura || '', incluye: p.incluye || [],
  }) : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 select-none" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' } as any}>
      <style>{`@media print { body * { display: none !important; } body::after { content: 'Documento protegido: pide una copia a tu proveedor.'; display: block; padding: 40px; font: 700 18px Arial; } } img { -webkit-user-drag: none; pointer-events: none; }`}</style>
      <div className="fixed inset-0 z-[60] pointer-events-none" style={{ backgroundImage: marcaSvg }} aria-hidden />
      {tapado && (
        <div className="fixed inset-0 z-[70] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 text-white" onClick={() => setTapado(false)}>
          <ShieldCheck className="w-12 h-12 text-emerald-300 mb-2" />
          <p className="text-lg font-black">Contenido protegido</p>
          <p className="text-sm text-slate-300 max-w-xs">Esta propuesta es solo para {quien}. Toca para seguir viéndola.</p>
        </div>
      )}
      <header className="text-white" style={{ background: color }}>
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          {p.empresa.logo && <img src={p.empresa.logo} alt="" className="h-12 w-12 object-contain bg-white rounded-xl p-1" />}
          <div className="min-w-0">
            <p className="text-xs font-bold opacity-90">{p.empresa.nombre}{p.empresa.telefono ? ` · Cel. ${p.empresa.telefono}` : ''}</p>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">{p.proyecto}</h1>
            <p className="text-xs opacity-90">{[p.cliente && `Para: ${p.cliente}`, p.ubicacion].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
        {/* Sus datos tal como los registró la empresa (para que los confirme) */}
        {p.datosCliente && (() => {
          const d = p.datosCliente;
          const oculto = (t?: string, ver = 3) => { const s = (t || '').replace(/\s/g, ''); return s.length > ver ? '•'.repeat(s.length - ver) + s.slice(-ver) : s; };
          const tel = (p.empresa.telefono || '').replace(/\D/g, '');
          const corregir = () => {
            const a = document.createElement('a');
            a.href = `https://wa.me/${tel.length === 9 ? '51' + tel : tel}?text=${encodeURIComponent(`Hola ${p.empresa.nombre}, soy ${d.nombre}. Revisé la propuesta "${p.proyecto}" y quiero corregir mis datos: `)}`;
            a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          };
          const filas: [string, string | undefined][] = [['Nombre', d.nombre], ['Empresa', d.empresa], ['DNI', d.dni && oculto(d.dni)], ['Celular', d.celular && oculto(d.celular)], ['Dirección', d.direccion], ['Correo', d.email]];
          return (
            <section className="bg-white rounded-2xl shadow-xs p-4 space-y-2">
              <p className="text-sm font-black text-slate-800">Tus datos registrados</p>
              <p className="text-[11px] text-slate-500">Así te tenemos en nuestra lista de clientes. Revisa que estén bien antes de aceptar.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {filas.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-dashed border-slate-100 text-xs"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-800 text-right">{v}</span></div>
                ))}
              </div>
              {tel && <button onClick={corregir} className="text-[11px] font-bold text-indigo-700 underline cursor-pointer">¿Algún dato no es correcto? Avísanos por WhatsApp</button>}
            </section>
          );
        })()}
        <section className="bg-white rounded-2xl shadow-xs overflow-hidden">
          {ver3d && hay3d ? (
            <div className="h-[60vh] min-h-[360px] relative">
              <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-400">Cargando 3D…</div>}>
                <TechosViewer3D nodes={p.escena.nodes} segments={p.escena.segments} coverageZones={p.escena.coverageZones} modoCliente />
              </Suspense>
            </div>
          ) : p.antes && p.imagen ? (
            <div className="grid grid-cols-2 gap-1">
              <figure><img src={p.antes} alt="Antes" className="w-full" /><figcaption className="text-center text-[11px] font-black text-slate-500 py-1">ANTES</figcaption></figure>
              <figure><img src={p.imagen} alt="Después" className="w-full" /><figcaption className="text-center text-[11px] font-black py-1" style={{ color }}>DESPUÉS</figcaption></figure>
            </div>
          ) : p.imagen ? <img src={p.imagen} alt="Tu techo" className="w-full" /> : null}
          {hay3d && (
            <button onClick={() => setVer3d(v => !v)} className="w-full py-3 text-sm font-black text-white cursor-pointer" style={{ background: color }}>
              {ver3d ? 'Ver la imagen' : 'Ver mi techo en 3D (gíralo con el dedo)'}
            </button>
          )}
        </section>

        {p.carta && <section className="bg-white rounded-2xl p-4 shadow-xs text-sm leading-relaxed text-slate-700 whitespace-pre-line">{p.carta}</section>}

        <section className="space-y-2">
          <h2 className="text-sm font-black uppercase" style={{ color }}>Elige tu opción</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {p.opciones.map((o, i) => (
              <button key={i} disabled={aceptada} onClick={() => setElegida(i)}
                className="relative text-left bg-white rounded-2xl border-2 p-4 cursor-pointer disabled:cursor-default"
                style={{ borderColor: elegida === i ? color : '#e2e8f0' }}>
                {o.recomendada && <span className="absolute -top-2.5 left-3 text-[10px] font-black text-white rounded-full px-2 py-0.5" style={{ background: color }}>RECOMENDADA</span>}
                <p className="text-xs font-black uppercase text-slate-500">Opción {String.fromCharCode(65 + i)}</p>
                <p className="text-lg font-black">{o.nombre}</p>
                <p className="text-2xl font-black">{S(o.total)}</p>
                <p className="text-[11px] font-bold text-slate-700 mt-1">{o.cobertura}</p>
                <p className="text-[11px] text-slate-500">{o.nota}</p>
              </button>
            ))}
          </div>
        </section>

        {p.incluye?.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-xs">
            <h2 className="text-sm font-black uppercase mb-1" style={{ color }}>Incluye</h2>
            <ul className="text-xs text-slate-700 space-y-1">{p.incluye.map(t => <li key={t}>✓ {t}</li>)}</ul>
          </section>
        )}

        {contrato && (
          <section className="bg-white rounded-2xl shadow-xs overflow-hidden">
            <button onClick={() => setVerContrato(v => !v)} className="w-full flex items-center gap-3 p-4 text-left cursor-pointer">
              <FileSignature className="w-6 h-6 shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black">Contrato de la obra</p>
                <p className="text-[11px] text-slate-500">Para revisar antes de aceptar · opción {p.opciones[elegida]?.nombre} · {S(p.opciones[elegida]?.total || 0)}</p>
              </div>
              <span className="text-xs font-black" style={{ color }}>{verContrato ? 'Ocultar' : 'Leer'}</span>
            </button>
            {verContrato && (
              <div className="px-4 pb-4 space-y-3 text-[12px] leading-relaxed text-slate-800 border-t border-slate-100 pt-3">
                <p className="text-center font-black underline text-[13px]">{contrato.titulo}</p>
                <p className="text-justify">{contrato.intro}</p>
                {contrato.clausulas.map(c => (
                  <div key={c.titulo}>
                    <p className="font-black text-[11.5px] uppercase">{c.titulo}</p>
                    {c.texto.map((t, i) => <p key={i} className="text-justify">{t}</p>)}
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-6 pt-6 text-center text-[10px] text-slate-600">
                  <div className="border-t border-slate-400 pt-1"><b className="block text-slate-800">{p.contrato!.contratista.nombre || p.empresa.nombre}</b>EL CONTRATISTA</div>
                  <div className="border-t border-slate-400 pt-1"><b className="block text-slate-800">{quien}</b>EL CLIENTE</div>
                </div>
                <p className="text-[10px] text-slate-500 bg-slate-50 rounded-lg p-2">Borrador para revisar. La firma del contrato se coordina con {p.empresa.nombre || 'la empresa'} al pagar el adelanto.</p>
              </div>
            )}
          </section>
        )}

        <section className="bg-white rounded-2xl p-4 shadow-xs space-y-3">
          {aceptada ? (
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
              <p className="text-base font-black">¡Propuesta aceptada!</p>
              <p className="text-xs text-slate-600">Opción {p.opciones[p.aceptadaOpcion ?? 0]?.nombre} · {p.aceptadaNombre} · {p.aceptadaEn ? new Date(p.aceptadaEn).toLocaleString('es-PE') : ''}</p>
              {p.empresa.telefono && <button onClick={avisar} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black cursor-pointer"><Send className="w-4 h-4" /> Avisar por WhatsApp</button>}
            </div>
          ) : (
            <>
              <p className="text-sm font-black">¿Te gusta? Acepta la opción {p.opciones[elegida]?.nombre} ({S(p.opciones[elegida]?.total || 0)})</p>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold select-text" style={{ WebkitUserSelect: 'text' } as any} />
              {contrato && (
                <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={leyoContrato} onChange={e => setLeyoContrato(e.target.checked)} className="mt-0.5" />
                  <span>Revisé el contrato de la obra (<button type="button" onClick={() => setVerContrato(true)} className="underline" style={{ color }}>leerlo</button>).</span>
                </label>
              )}
              <button onClick={aceptar} disabled={!nombre.trim() || enviando || (!!contrato && !leyoContrato)} className="w-full py-3 rounded-xl text-white text-sm font-black cursor-pointer disabled:opacity-40" style={{ background: color }}>
                {enviando ? 'Enviando…' : 'Aceptar propuesta'}
              </button>
              <p className="text-[10px] text-slate-400 text-center">Al aceptar, {p.empresa.nombre || 'la empresa'} recibe tu elección y se comunica contigo para coordinar el adelanto.</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
