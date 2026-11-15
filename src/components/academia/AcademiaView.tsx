// Academia técnica: "Tienda" (portada, paquetes, cursos, plantillas) y "Mis clases" (el reproductor y la
// gestión de siempre). El selector va integrado en la portada de la tienda (sin franja aparte) y la
// tienda ocupa todo el ancho, de borde a borde.
import { useState, type ReactNode } from 'react';
import { Store, PlayCircle } from 'lucide-react';
import AcademiaTienda from './AcademiaTienda';
import type { CourseCategory, TutorialVideo } from '../UsabilidadVideosView';
import type { BibliotecaItem } from '../BibliotecaPremiumView';

interface Props {
  cursos: CourseCategory[]; tutoriales: TutorialVideo[]; biblioteca: BibliotecaItem[];
  isAdmin?: boolean; currentUser?: any;
  onIrRecursos: () => void;
  renderClases: (cursoInicial: string | null) => ReactNode;
}

export default function AcademiaView({ renderClases, ...p }: Props) {
  const [pestana, setPestana] = useState<'tienda' | 'clases'>(() => {
    try { return localStorage.getItem('academia_pestana') === 'clases' ? 'clases' : 'tienda'; } catch { return 'tienda'; }
  });
  const [curso, setCurso] = useState<string | null>(null);
  const ir = (t: 'tienda' | 'clases', c: string | null = null) => {
    setCurso(c); setPestana(t);
    try { localStorage.setItem('academia_pestana', t); } catch { /* sin almacenamiento */ }
  };
  const selector = (
    <div className="inline-flex p-1 rounded-full shadow-lg" style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)' }}>
      {([['tienda', 'Tienda', Store], ['clases', 'Mis clases', PlayCircle]] as const).map(([id, t, Ic]) => (
        <button key={id} onClick={() => ir(id)}
          className={`px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-1.5 cursor-pointer transition-colors ${pestana === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>
          <Ic className="w-4 h-4" />{t}
        </button>
      ))}
    </div>
  );
  if (pestana === 'tienda') return (
    // Anula el margen del contenedor de la app: la tienda va de borde a borde.
    <div className="-mx-4 -mt-4 xl:-mx-8 xl:-mt-8">
      <AcademiaTienda {...p} pestanas={selector} onVerCurso={n => ir('clases', n)} />
    </div>
  );
  return (
    <div>
      <div className="mb-3">{selector}</div>
      <div key={curso || '_'}>{renderClases(curso)}</div>
    </div>
  );
}
