// Atajo "Agua y desagüe" de Techos: abre Gasfitería con el techo de fondo (área y columnas),
// en el mismo origen que usa Electricidad, para verlos juntos en "Todo en 3D".
import { Droplets } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { KEY_ORIGEN_GAS } from './modeloGasfiteria';

export default function BotonGasfiteria({ className = '' }: { className?: string }) {
  const abrir = () => {
    safeStorage.setItem(KEY_ORIGEN_GAS, 'techos');
    window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'gasfiteria' }));
  };
  return (
    <button type="button" onClick={abrir} title="Agua y desagüe: abre Gasfitería con este techo de fondo"
      className={`shrink-0 inline-flex items-center justify-center min-h-[36px] w-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer ${className}`}>
      <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
    </button>
  );
}
