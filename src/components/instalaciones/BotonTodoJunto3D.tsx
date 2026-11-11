// Botón "Todo en 3D" (techo + luz + agua). La ventana con three.js se carga solo al abrirla.
import { lazy, Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box } from 'lucide-react';

const VentanaTodoJunto3D = lazy(() => import('./TodoJunto3D'));

export default function BotonTodoJunto3D({ conTexto = false, className = '', origen = 'techos' }: { conTexto?: boolean; className?: string; origen?: 'techos' | 'obra' }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} title={origen === 'obra' ? 'Todo en 3D: los muros con su luz y su agua' : 'Todo en 3D: el techo con su luz y su agua'}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl bg-slate-900 text-white hover:bg-slate-700 text-xs font-bold cursor-pointer ${conTexto ? 'px-3' : 'w-10 lg:w-auto lg:px-2.5'} ${className}`}>
        <Box className="w-4 h-4 shrink-0" />{conTexto ? <span>Todo en 3D</span> : <span className="hidden lg:inline whitespace-nowrap">Todo en 3D</span>}
      </button>
      {abierto && createPortal(
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-900/70 flex items-center justify-center text-white text-sm font-bold">Cargando 3D…</div>}>
          <VentanaTodoJunto3D origen={origen} onClose={() => setAbierto(false)} />
        </Suspense>, document.body,
      )}
    </>
  );
}
