// Precios de Drywall, OSB y Ladrillo en su unidad de compra (plancha, millar).
// Se guardan en el Catálogo de precios único: cambian también en Drywall.
import { useState } from 'react';
import { precio, fijarPrecio, claveDrywall, claveOsb, claveLadrillo, AREA_PLANCHA_M2, useCatalogo } from '../../lib/catalogoPrecios';
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
import { OsbItem } from '../../catalogo/osb';

interface Props {
  drywall: DrywallItem[];
  ladrillo: LadrilloItem[];
  onDrywall: (c: DrywallItem[]) => void;
  onLadrillo: (c: LadrilloItem[]) => void;
  osb: OsbItem[];
  onOsb: (c: OsbItem[]) => void;
}

const inputCls = 'w-full px-2.5 py-2 rounded-lg bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200';
const num = (v: string) => Math.max(0, parseFloat(v) || 0);

export function AdminCatalogosMateriales({ drywall, ladrillo, onLadrillo, osb }: Props) {
  const [tab, setTab] = useState<'drywall' | 'ladrillo' | 'osb'>('drywall');
  useCatalogo();
  const plancha = (clave: string, m2: number) => Math.round(precio(clave, m2 * AREA_PLANCHA_M2) * 100) / 100;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-black text-slate-400 uppercase">Precios de muros (tus proveedores)</p>
        <div className="inline-flex p-0.5 bg-slate-100 rounded-xl">
          {(['drywall', 'ladrillo', 'osb'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${tab === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              {t === 'drywall' ? 'Drywall' : t === 'osb' ? 'OSB' : 'Ladrillo'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'osb' ? (
        <div className="space-y-2">
          {osb.map(d => (
            <div key={d.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2 items-end pb-2">
              <div>
                <p className="text-xs font-bold text-slate-800">{d.tipo}</p>
                <p className="text-[10px] text-slate-500">{d.espesor} mm · {d.pesoM2} kg/m² · plancha 1.22 × 2.44 m</p>
              </div>
              <label className="text-[11px] font-bold text-slate-600">S/ por plancha
                <input type="number" inputMode="decimal" min={0} value={plancha(claveOsb(d.id), d.precioM2)}
                  onChange={e => fijarPrecio(claveOsb(d.id), num(e.target.value), 'Obra Civil')}
                  className={inputCls} />
              </label>
            </div>
          ))}
        </div>
      ) : tab === 'drywall' ? (
        <div className="space-y-2">
          {drywall.map(d => (
            <div key={d.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2 items-end pb-2">
              <div>
                <p className="text-xs font-bold text-slate-800">{d.tipo}</p>
                <p className="text-[10px] text-slate-500">{d.espesor} mm · {d.pesoM2} kg/m² · plancha 1.22 × 2.44 m</p>
              </div>
              <label className="text-[11px] font-bold text-slate-600">S/ por plancha
                <input type="number" inputMode="decimal" min={0} value={plancha(claveDrywall(d.id), d.precioM2)}
                  onChange={e => fijarPrecio(claveDrywall(d.id), num(e.target.value), 'Obra Civil')}
                  className={inputCls} />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {ladrillo.map(l => (
            <div key={l.id} className="grid grid-cols-2 sm:grid-cols-[1fr_140px_110px] gap-2 items-end pb-2">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-bold text-slate-800">{l.tipo}</p>
                <p className="text-[10px] text-slate-500">{l.dimensiones} · {l.pesoUnitario} kg/u · {l.uso}</p>
              </div>
              <label className="text-[11px] font-bold text-slate-600">S/ por millar
                <input type="number" inputMode="decimal" min={0} value={precio(claveLadrillo(l.id), l.precioxMil)}
                  onChange={e => fijarPrecio(claveLadrillo(l.id), num(e.target.value), 'Obra Civil')}
                  className={inputCls} />
              </label>
              <label className="text-[11px] font-bold text-slate-600">Unid. por m²
                <input type="number" inputMode="decimal" min={0} value={l.unidadesM2}
                  onChange={e => onLadrillo(ladrillo.map(x => x.id === l.id ? { ...x, unidadesM2: num(e.target.value) } : x))}
                  className={inputCls} />
              </label>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400">Precios del Catálogo de precios (menú Precios): si los cambias aquí, cambian en todos los apartados.</p>
    </div>
  );
}
