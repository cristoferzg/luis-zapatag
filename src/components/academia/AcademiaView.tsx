// Academia técnica: pestañas "Tienda" (portada, paquetes, cursos, plantillas) y "Mis clases"
// (el reproductor y la gestión de siempre). Al tocar "Ir a las clases" se abre el curso elegido.
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
    try { return (localStorage.getItem('academia_pestana') as any) === 'clases' ? 'clases' : 'tienda'; } catch { return 'tienda'; }
  });
  const [curso, setCurso] = useState<string | null>(null);
  const ir = (t: 'tienda' | 'clases', c: string | null = null) => {
    setCurso(c); setPestana(t);
    try { localStorage.setItem('academia_pestana', t); } catch { /* sin almacenamiento */ }
  };
  return (
    <div className="w-full h-full flex flex-col">
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 sm:px-6 pt-2 flex gap-1">
        {([['tienda', 'Tienda', Store], ['clases', 'Mis clases', PlayCircle]] as const).map(([id, t, Ic]) => (
          <button key={id} onClick={() => ir(id)}
            className={`px-4 py-2.5 text-sm font-black flex items-center gap-1.5 border-b-2 -mb-px cursor-pointer ${pestana === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Ic className="w-4 h-4" />{t}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {pestana === 'tienda'
          ? <AcademiaTienda {...p} onVerCurso={n => ir('clases', n)} />
          : <div key={curso || '_'} className="w-full h-full overflow-y-auto">{renderClases(curso)}</div>}
      </div>
    </div>
  );
}
