// Academia técnica: un solo apartado con tres pestañas integradas en la portada (sin franja aparte):
// "Tienda" (paquetes, cursos y plantillas a la venta), "Mis cursos" (el reproductor y la gestión de clases)
// y "Mis plantillas" (lo que antes era Recursos Técnicos: plantillas, planos y libros, con "Abrir en ...").
// Todo va de borde a borde, con la misma banda oscura del diseño A arriba.
import { useState, type ReactNode } from 'react';
import { Store, PlayCircle, Layers, GraduationCap } from 'lucide-react';
import AcademiaTienda from './AcademiaTienda';
import type { CourseCategory, TutorialVideo } from '../UsabilidadVideosView';
import type { BibliotecaItem } from '../BibliotecaPremiumView';

export type PestanaAcademia = 'tienda' | 'clases' | 'plantillas';
const CLAVE = 'academia_pestana';
export const abrirPestanaAcademia = (p: PestanaAcademia) => { try { localStorage.setItem(CLAVE, p); } catch { /* sin almacenamiento */ } };

interface Props {
  cursos: CourseCategory[]; tutoriales: TutorialVideo[]; biblioteca: BibliotecaItem[];
  isAdmin?: boolean; currentUser?: any;
  conPlantillas?: boolean;   // false si el admin apagó "Recursos" para los usuarios
  renderClases: (cursoInicial: string | null) => ReactNode;
  renderPlantillas: () => ReactNode;
}

const TEXTO: Record<Exclude<PestanaAcademia, 'tienda'>, [string, string]> = {
  clases: ['Mis cursos', 'Tus clases en video, a tu ritmo. Retoma donde te quedaste.'],
  plantillas: ['Mis plantillas', 'Diseños listos para abrir en Techos, Carpintería o Drywall, planos y libros técnicos.'],
};

export default function AcademiaView({ renderClases, renderPlantillas, conPlantillas = true, ...p }: Props) {
  const [pestana, setPestana] = useState<PestanaAcademia>(() => {
    try {
      const v = localStorage.getItem(CLAVE);
      return v === 'clases' || (v === 'plantillas' && conPlantillas) ? v : 'tienda';
    } catch { return 'tienda'; }
  });
  const [curso, setCurso] = useState<string | null>(null);
  const ir = (t: PestanaAcademia, c: string | null = null) => { setCurso(c); setPestana(t); abrirPestanaAcademia(t); };

  const opciones = ([['tienda', 'Tienda', Store], ['clases', 'Mis cursos', PlayCircle], ['plantillas', 'Mis plantillas', Layers]] as const)
    .filter(([id]) => id !== 'plantillas' || conPlantillas);
  const selector = (
    <div className="inline-flex max-w-full overflow-x-auto p-1 rounded-full shadow-lg" style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)' }}>
      {opciones.map(([id, t, Ic]) => (
        <button key={id} onClick={() => ir(id)}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] sm:text-sm font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${pestana === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}>
          <Ic className="w-4 h-4" />{t}
        </button>
      ))}
    </div>
  );

  return (
    // Anula el margen del contenedor de la app: la Academia va de borde a borde.
    <div className="-mx-4 -mt-4 xl:-mx-8 xl:-mt-8">
      {pestana === 'tienda' ? (
        <AcademiaTienda {...p} pestanas={selector} onVerCurso={n => ir('clases', n)} onIrRecursos={() => ir(conPlantillas ? 'plantillas' : 'tienda')} />
      ) : (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #6366f1 0, transparent 40%), radial-gradient(circle at 85% 70%, #f59e0b 0, transparent 35%)' }} />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-5 sm:pb-6">
              {selector}
              <h1 className="mt-4 text-xl sm:text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}><GraduationCap className="w-6 h-6 text-amber-300" />{TEXTO[pestana][0]}</h1>
              <p className="text-xs sm:text-sm" style={{ color: '#cbd5e1' }}>{TEXTO[pestana][1]}</p>
            </div>
          </section>
          <div key={pestana + (curso || '_')} className="px-4 xl:px-8 pt-4">
            {pestana === 'clases' ? renderClases(curso) : renderPlantillas()}
          </div>
        </>
      )}
    </div>
  );
}
