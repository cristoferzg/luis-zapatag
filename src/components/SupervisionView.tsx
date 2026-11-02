// =============================================================================
// Supervisión (solo admin): datos de cada usuario en un lugar aparte, sin
// mezclarse con los proyectos del admin. Permite descargar un respaldo .json
// por usuario y restaurarlo en otro usuario (por ejemplo, uno nuevo creado
// porque el anterior se perdió).
// =============================================================================
import React, { useMemo, useRef, useState } from 'react';
import {
  Eye, Search, Download, Upload, FolderKanban, Users, Wallet, ChevronLeft, ShieldCheck, AlertTriangle, Check, X,
} from 'lucide-react';
import type { Client, FinanceRecord, Project, SystemConfig, SystemUser } from '../types';

interface Props {
  usuarios: SystemUser[];
  projects: Project[];
  clients: Client[];
  finances: FinanceRecord[];
  settings: SystemConfig[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setFinances: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
}

export interface RespaldoUsuario {
  formato: 'innova-respaldo-usuario';
  version: 1;
  fecha: string;
  usuario: { id: string; name: string; role: string; email?: string; phone?: string };
  projects: Project[];
  clients: Client[];
  finances: FinanceRecord[];
  settings: SystemConfig[];
}

const bare = (id: string) => id.replace(/^user_/, '');
/** Formas en que un registro puede llevar el espacio de trabajo del usuario. */
const delUsuario = (u: SystemUser) => {
  // (No se usa u.userId: en los registros de usuarios guarda quién lo creó, normalmente el admin.)
  const core = bare(u.id).replace(/^usr_/, '');
  const ids = new Set([u.id, core, `user_${core}`, `usr_${core}`, `user_usr_${core}`]);
  return (r: any) => ids.has(r?.userId) || r?.id === `settings_user_${bare(u.id)}`;
};

const soles = (n: number) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SupervisionView({ usuarios, projects, clients, finances, settings, setProjects, setClients, setFinances, setSettings }: Props) {
  const [busca, setBusca] = useState('');
  const [verId, setVerId] = useState<string | null>(null);
  const [restaurar, setRestaurar] = useState<{ respaldo: RespaldoUsuario; destinoId: string } | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const refArchivo = useRef<HTMLInputElement>(null);

  const lista = useMemo(() => usuarios
    .filter(u => u.role !== 'admin' && u.id !== 'admin' && u.id !== 'admin_master')
    .map(u => {
      const es = delUsuario(u);
      return { u, projects: projects.filter(es), clients: clients.filter(es), finances: finances.filter(es), settings: settings.filter(es) };
    })
    .filter(x => !busca.trim() || x.u.name.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (b.projects.length + b.clients.length + b.finances.length) - (a.projects.length + a.clients.length + a.finances.length)
      || (b.u.lastLoginTimestamp || 0) - (a.u.lastLoginTimestamp || 0)),
  [usuarios, projects, clients, finances, settings, busca]);

  const descargar = (x: typeof lista[number]) => {
    const r: RespaldoUsuario = {
      formato: 'innova-respaldo-usuario', version: 1, fecha: new Date().toISOString(),
      // Sin el PIN: el respaldo puede circular y el PIN es la llave de acceso.
      usuario: { id: x.u.id, name: x.u.name, role: x.u.role, email: x.u.email, phone: x.u.phone },
      projects: x.projects, clients: x.clients, finances: x.finances, settings: x.settings,
    };
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo_${x.u.name.replace(/[^\wáéíóúñ]+/gi, '_')}_${r.fecha.slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const leerArchivo = async (f: File | undefined) => {
    if (!f) return;
    try {
      const r = JSON.parse(await f.text()) as RespaldoUsuario;
      if (r?.formato !== 'innova-respaldo-usuario') throw new Error('No es un respaldo de usuario de Innova.');
      setRestaurar({ respaldo: r, destinoId: '' });
    } catch (e: any) {
      setAviso({ ok: false, texto: e?.message || 'El archivo no se pudo leer.' });
    }
  };

  const aplicarRestauracion = () => {
    if (!restaurar?.destinoId) return;
    const destino = usuarios.find(u => u.id === restaurar.destinoId);
    if (!destino) return;
    const ws = `user_${bare(destino.id)}`;
    const sufijo = `_r${Date.now().toString(36)}`;
    // Ids nuevos: si el usuario original aún existe, sus datos no se pisan.
    const mover = <T extends { id: string }>(arr: T[]) => (arr || []).map(r => ({ ...r, id: `${r.id}${sufijo}`, userId: ws }));
    const { respaldo: r } = restaurar;
    setProjects(prev => [...prev, ...mover(r.projects)]);
    setClients(prev => [...prev, ...mover(r.clients)]);
    setFinances(prev => [...prev, ...mover(r.finances)]);
    if (r.settings?.length) {
      const id = `settings_${ws}`;
      setSettings(prev => [...prev.filter(s => s.id !== id), { ...r.settings[0], id, userId: ws } as SystemConfig]);
    }
    setAviso({ ok: true, texto: `Se restauraron ${r.projects.length} proyectos, ${r.clients.length} clientes y ${r.finances.length} movimientos en “${destino.name}”.` });
    setRestaurar(null);
  };

  const viendo = lista.find(x => x.u.id === verId);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5"><Eye className="w-7 h-7 text-indigo-600" />Supervisión</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">Datos de tus usuarios, separados de tus propios proyectos. Solo lectura, con respaldo y restauración.</p>
        </div>
        <button onClick={() => refArchivo.current?.click()} className="self-start sm:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />Restaurar respaldo
        </button>
        <input ref={refArchivo} type="file" accept="application/json,.json" className="hidden" onChange={e => { leerArchivo(e.target.files?.[0]); e.target.value = ''; }} />
      </header>

      {aviso && (
        <div className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm font-bold ${aviso.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <span className="flex items-center gap-2">{aviso.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{aviso.texto}</span>
          <button onClick={() => setAviso(null)} className="cursor-pointer" aria-label="Cerrar aviso"><X className="w-4 h-4" /></button>
        </div>
      )}

      {!viendo ? (
        <>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuario…"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lista.map(x => (
              <div key={x.u.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">{(x.u.name || '?').charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-800 truncate">{x.u.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{x.u.isActive === false ? 'Desactivado · ' : ''}Último ingreso: {x.u.lastLogin || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[{ i: FolderKanban, n: x.projects.length, t: 'Proyectos' }, { i: Users, n: x.clients.length, t: 'Clientes' }, { i: Wallet, n: x.finances.length, t: 'Movim.' }].map(k => (
                    <div key={k.t} className="bg-slate-50 rounded-xl py-2">
                      <k.i className="w-4 h-4 text-slate-400 mx-auto" />
                      <p className="text-lg font-black text-slate-800 leading-tight">{k.n}</p>
                      <p className="text-[10px] font-bold text-slate-500">{k.t}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setVerId(x.u.id)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"><Eye className="w-3.5 h-3.5" />Ver datos</button>
                  <button onClick={() => descargar(x)} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" />Respaldo</button>
                </div>
              </div>
            ))}
            {lista.length === 0 && <p className="text-sm text-slate-500">No hay usuarios{busca ? ' con ese nombre' : ''}.</p>}
          </div>
          <p className="text-[11px] text-slate-400 flex items-start gap-1.5 max-w-3xl"><ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            El respaldo incluye proyectos, clientes, movimientos y datos de empresa guardados en la nube. No incluye el PIN ni los diseños que el usuario solo tiene abiertos en su equipo.</p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={() => setVerId(null)} className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"><ChevronLeft className="w-4 h-4" />Todos los usuarios</button>
            <button onClick={() => descargar(viendo)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" />Descargar respaldo</button>
          </div>
          <h2 className="text-xl font-black text-slate-800">{viendo.u.name} <span className="text-xs font-bold text-slate-400">· solo lectura</span></h2>
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <h3 className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-700 flex items-center gap-2"><FolderKanban className="w-4 h-4 text-indigo-600" />Proyectos ({viendo.projects.length})</h3>
            <div className="divide-y divide-slate-100">
              {viendo.projects.map(p => (
                <div key={p.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0"><b className="text-slate-800">{p.name}</b> <span className="text-slate-500">· {p.client || 'sin cliente'} · {p.date}</span></span>
                  <span className="flex items-center gap-2 text-xs"><span className="font-bold text-slate-700">{soles(p.presupuesto)}</span><span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">{p.status}</span></span>
                </div>
              ))}
              {!viendo.projects.length && <p className="px-4 py-3 text-xs text-slate-400">Sin proyectos.</p>}
            </div>
          </section>
          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <h3 className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-700 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" />Clientes ({viendo.clients.length})</h3>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {viendo.clients.map(c => <p key={c.id} className="px-4 py-2 text-sm text-slate-700">{c.name}{(c as any).company ? <span className="text-slate-400"> · {(c as any).company}</span> : null}</p>)}
                {!viendo.clients.length && <p className="px-4 py-3 text-xs text-slate-400">Sin clientes.</p>}
              </div>
            </section>
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <h3 className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-700 flex items-center gap-2"><Wallet className="w-4 h-4 text-indigo-600" />Movimientos ({viendo.finances.length})</h3>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {viendo.finances.slice(0, 200).map(f => (
                  <p key={f.id} className="px-4 py-2 text-sm flex justify-between gap-2"><span className="text-slate-700 truncate">{f.description} <span className="text-slate-400 text-xs">· {f.type} · {f.date}</span></span><b className={f.type === 'ingreso' ? 'text-emerald-600' : 'text-slate-700'}>{soles(f.amount)}</b></p>
                ))}
                {!viendo.finances.length && <p className="px-4 py-3 text-xs text-slate-400">Sin movimientos.</p>}
              </div>
            </section>
          </div>
        </div>
      )}

      {restaurar && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-600" />Restaurar respaldo</h3>
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
              Respaldo de <b>{restaurar.respaldo.usuario.name}</b> del {restaurar.respaldo.fecha.slice(0, 10)}:<br />
              {restaurar.respaldo.projects.length} proyectos · {restaurar.respaldo.clients.length} clientes · {restaurar.respaldo.finances.length} movimientos
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">¿En qué usuario se restaura?</label>
              <select value={restaurar.destinoId} onChange={e => setRestaurar({ ...restaurar, destinoId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400">
                <option value="">— Elige el usuario —</option>
                {lista.map(x => <option key={x.u.id} value={x.u.id}>{x.u.name}{x.projects.length + x.clients.length ? ` (ya tiene ${x.projects.length} proyectos)` : ' (nuevo)'}</option>)}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">Primero crea el usuario nuevo en “Accesos (PIN)”. Los datos se suman a lo que ya tenga; no se borra nada.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRestaurar(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button disabled={!restaurar.destinoId} onClick={aplicarRestauracion} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-black cursor-pointer">Restaurar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
