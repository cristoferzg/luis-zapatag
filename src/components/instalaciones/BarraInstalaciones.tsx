// Barra común de Techos, Obra Civil y Drywall: ⚡ Luz · 💧 Agua · ⬛ Todo en 3D, siempre en el
// mismo lugar y con los mismos nombres. Luz y Agua abren Electricidad y Gasfitería con este
// plano de fondo; "Todo en 3D" muestra el plano con su luz y su agua juntos.
import { Zap, Droplets } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { KEY_ORIGEN } from '../electricidad/modeloElectricidad';
import { KEY_ORIGEN_GAS } from '../gasfiteria/modeloGasfiteria';
import BotonTodoJunto3D from './BotonTodoJunto3D';

export type OrigenInstalaciones = 'techos' | 'obra' | 'drywall' | 'melamina';

export default function BarraInstalaciones({ origen, className = '' }: { origen: OrigenInstalaciones; className?: string }) {
  const ir = (vista: 'electricidad' | 'gasfiteria') => {
    safeStorage.setItem(vista === 'electricidad' ? KEY_ORIGEN : KEY_ORIGEN_GAS, origen);
    window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: vista }));
  };
  const base = 'shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl border text-xs font-bold cursor-pointer w-10 lg:w-auto lg:px-2.5';
  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      <button type="button" onClick={() => ir('electricidad')} title="Luz: abre Electricidad con este plano de fondo (luces, tomacorrientes, tablero)"
        className={`${base} bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100`}>
        <Zap className="w-4 h-4 text-amber-500 shrink-0" /><span className="hidden lg:inline">Luz</span>
      </button>
      <button type="button" onClick={() => ir('gasfiteria')} title="Agua y desagüe: abre Gasfitería con este plano de fondo"
        className={`${base} bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100`}>
        <Droplets className="w-4 h-4 text-sky-500 shrink-0" /><span className="hidden lg:inline">Agua</span>
      </button>
      <BotonTodoJunto3D origen={origen === 'techos' ? 'techos' : origen === 'melamina' ? 'melamina' : 'obra'} />
    </div>
  );
}
