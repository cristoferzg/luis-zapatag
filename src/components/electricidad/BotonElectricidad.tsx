// Atajo "Instalación eléctrica" para los otros apartados: guarda de dónde viene
// (para usar ese plano de fondo) y abre Electricidad.
import { Zap } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { KEY_ORIGEN } from './modeloElectricidad';

export type OrigenElectricidad = 'obra' | 'drywall' | 'gasfiteria' | 'melamina' | 'techos';

/** En el celular solo el ícono; en PC con su texto (o siempre ícono con `compacto`). */
export default function BotonElectricidad({ origen, className = '', compacto = false }: { origen: OrigenElectricidad; className?: string; compacto?: boolean }) {
  const abrir = () => {
    safeStorage.setItem(KEY_ORIGEN, origen);
    window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'electricidad' }));
  };
  return (
    <button type="button" onClick={abrir} title="Instalación eléctrica: abre Electricidad con este plano de fondo"
      className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold cursor-pointer ${compacto ? 'w-10 px-0' : 'w-10 px-0 lg:w-auto lg:px-2.5'} ${className}`}>
      <Zap className="w-4 h-4 text-amber-500 shrink-0" />{!compacto && <span className="hidden lg:inline whitespace-nowrap">Instalación eléctrica</span>}
    </button>
  );
}
