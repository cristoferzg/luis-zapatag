// =============================================================================
// Generador de "Columnas por medidas exactas".
//
// Permite al usuario definir CUÁNTAS columnas tiene su obra y, por cada una, su
// posición exacta en planta (X, Z) y su altura real (H), en metros — tal como
// las midió en obra. Así la simulación coincide con la realidad (en vez de
// dibujar "a ojo" sobre la rejilla).
//
// Cada columna puede marcarse como "concreto existente": en ese caso se le
// coloca una placa base + pernos de anclaje en la parte superior (la conexión
// que el herrero sí instala sobre la columna de concreto ya construida).
//
// Es ADITIVO: usa la API pública del motor (addNode / addSegment), no toca su
// lógica interna, por lo que no afecta a los diseños existentes.
// =============================================================================
import { useState } from 'react';
import { X, Plus, Trash2, Columns, Check, Grid3x3 } from 'lucide-react';

interface ColumnaExacta {
  x: string;      // Posición X en planta (m)
  z: string;      // Posición Z / profundidad en planta (m)
  altura: string; // Altura de la columna (m)
  concreto: boolean; // ¿Columna de concreto existente? (placa base encima)
}

interface Props {
  engineState: any;
  onClose: () => void;
  onDone?: (cantidad: number) => void;
}

const nuevaFila = (altura = '3.00'): ColumnaExacta => ({ x: '', z: '', altura, concreto: true });

export default function TechosColumnasExactasModal({ engineState, onClose, onDone }: Props) {
  const [filas, setFilas] = useState<ColumnaExacta[]>([
    { x: '0.00', z: '0.00', altura: '3.00', concreto: true },
    { x: '3.00', z: '0.00', altura: '3.00', concreto: true },
    { x: '0.00', z: '4.00', altura: '3.00', concreto: true },
    { x: '3.00', z: '4.00', altura: '3.00', concreto: true }
  ]);
  const [limpiarAntes, setLimpiarAntes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCantidad = (n: number) => {
    const cant = Math.max(1, Math.min(60, Math.floor(n) || 1));
    setFilas(prev => {
      const next = [...prev];
      if (cant > next.length) {
        const alturaBase = next[next.length - 1]?.altura || '3.00';
        while (next.length < cant) next.push(nuevaFila(alturaBase));
      } else {
        next.length = cant;
      }
      return next;
    });
  };

  const updateFila = (i: number, campo: keyof ColumnaExacta, valor: string | boolean) => {
    setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f));
  };

  const generar = () => {
    setError(null);
    // Validar
    const parsed = filas.map((f, i) => {
      const x = parseFloat(f.x);
      const z = parseFloat(f.z);
      const h = parseFloat(f.altura);
      return { i, x, z, h, concreto: f.concreto, ok: Number.isFinite(x) && Number.isFinite(z) && Number.isFinite(h) && h > 0 };
    });
    const invalida = parsed.find(p => !p.ok);
    if (invalida) {
      setError(`Revisa la columna ${invalida.i + 1}: la posición (X, Z) y la altura deben ser números válidos y la altura mayor que 0.`);
      return;
    }

    try {
      // Construimos TODA la escena y la cargamos de una sola vez con loadScene.
      // (Llamar addNode/addSegment en bucle no acumula bien por el estado de React.)
      const profId = engineState.activeProfileId || 'perfil_default';
      const nodes: Record<string, any> = {};
      const segments: Record<string, any> = {};
      const stamp = Date.now();

      parsed.forEach((p, idx) => {
        const baseId = `col_base_${stamp}_${idx}`;
        const topId = `col_top_${stamp}_${idx}`;
        // Nodo base (apoyo fijo, y=0) y nodo superior (y=altura).
        nodes[baseId] = {
          id: baseId, x: p.x, y: 0, z: p.z,
          isFixedSupport: true, nodeLabel: `COL-${idx + 1}-BASE`
        };
        nodes[topId] = {
          id: topId, x: p.x, y: p.h, z: p.z,
          nodeLabel: `COL-${idx + 1}-TOP`,
          // Columna de concreto existente → placa base + pernos en la parte
          // superior (la conexión que se apoya sobre el concreto ya construido).
          ...(p.concreto ? { isFixedSupport: true, numPernos: 4, boltDiameter: '5/8"' } : {})
        };
        const segId = `col_seg_${stamp}_${idx}`;
        segments[segId] = {
          id: segId, nodeAId: baseId, nodeBId: topId,
          profileId: profId,
          // Concreto existente → rol propio (gris, grueso, excluido del acero).
          rolEstructural: p.concreto ? 'columna_concreto' : 'columna'
        };
      });

      let finalNodes = nodes;
      let finalSegments = segments;
      if (!limpiarAntes) {
        finalNodes = { ...(engineState.nodes || {}), ...nodes };
        finalSegments = { ...(engineState.segments || {}), ...segments };
      }

      if (typeof engineState.loadScene === 'function') {
        engineState.loadScene(finalNodes, finalSegments, limpiarAntes ? {} : (engineState.coverageZones || {}));
      } else {
        throw new Error('motor no disponible');
      }

      onDone?.(parsed.length);
      onClose();
    } catch (e: any) {
      setError('No se pudieron generar las columnas: ' + (e?.message || 'error inesperado.'));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <Columns className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Columnas por medidas exactas</h3>
              <p className="text-[11px] text-slate-500">Posición y altura reales de cada columna</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cantidad */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-amber-600" />
            N° de columnas:
            <input
              type="number"
              min={1}
              max={60}
              value={filas.length}
              onChange={e => setCantidad(parseInt(e.target.value, 10))}
              className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          <label className="text-[11px] text-slate-600 flex items-center gap-1.5 cursor-pointer ml-auto">
            <input type="checkbox" checked={limpiarAntes} onChange={e => setLimpiarAntes(e.target.checked)} className="accent-amber-600" />
            Limpiar lienzo antes de generar
          </label>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto_28px] gap-1.5 items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1 pb-1 sticky top-0 bg-white">
            <span>#</span>
            <span>X (m)</span>
            <span>Z (m)</span>
            <span>Altura (m)</span>
            <span className="text-center">Concreto</span>
            <span></span>
          </div>
          {filas.map((f, i) => (
            <div key={i} className="grid grid-cols-[28px_1fr_1fr_1fr_auto_28px] gap-1.5 items-center py-1">
              <span className="text-[11px] font-bold text-slate-400 text-center">{i + 1}</span>
              <input value={f.x} onChange={e => updateFila(i, 'x', e.target.value)} inputMode="decimal"
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0.00" />
              <input value={f.z} onChange={e => updateFila(i, 'z', e.target.value)} inputMode="decimal"
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0.00" />
              <input value={f.altura} onChange={e => updateFila(i, 'altura', e.target.value)} inputMode="decimal"
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="3.00" />
              <label className="flex items-center justify-center cursor-pointer" title="Columna de concreto existente (placa base + pernos encima)">
                <input type="checkbox" checked={f.concreto} onChange={e => updateFila(i, 'concreto', e.target.checked)} className="accent-slate-600 w-4 h-4" />
              </label>
              <button onClick={() => setFilas(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer" title="Eliminar fila">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => setFilas(prev => [...prev, nuevaFila(prev[prev.length - 1]?.altura)])}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Agregar columna
          </button>
        </div>

        {/* Ayuda + error */}
        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-500 leading-snug">
            <strong>X</strong> = posición a lo ancho · <strong>Z</strong> = posición a lo largo (profundidad) · <strong>Altura</strong> = alto de la columna.
            Marca <strong>Concreto</strong> si la columna ya existe (se le pone placa base + pernos encima).
          </p>
          {error && <p className="text-[11px] text-rose-600 font-semibold mt-1.5">{error}</p>}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
            Cancelar
          </button>
          <button onClick={generar} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
            <Check className="w-4 h-4" /> Generar columnas
          </button>
        </div>
      </div>
    </div>
  );
}
