// Modo SENCILLO / EXPERTO de Techos Metálicos y el "¿Qué es?" de las palabras difíciles.
// Sencillo (por defecto para quien recién empieza): oculta lo técnico (códigos de los nudos,
// coordenadas, panel de piezas abierto, opciones de experto del asistente). Experto: todo como antes.
// Solo cambia lo que se ve; los cálculos, materiales y precios son los mismos en los dos modos.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HelpCircle, X } from 'lucide-react';

export type ModoTechos = 'sencillo' | 'experto';
const CLAVE = 'techos_modo';
const EVENTO = 'innova_techos_modo';

function leerModo(): ModoTechos {
  try {
    const v = localStorage.getItem(CLAVE);
    if (v === 'sencillo' || v === 'experto') return v;
    // Quien ya usó Techos (guardó materiales o ajustes) sigue viendo todo como siempre.
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^techos_(extra_materials|tijeral_abajo)/.test(k)) return 'experto';
    }
  } catch { /* sin almacenamiento */ }
  return 'sencillo';
}
export function fijarModoTechos(m: ModoTechos) {
  try { localStorage.setItem(CLAVE, m); } catch { /* */ }
  window.dispatchEvent(new Event(EVENTO));
}
const suscribir = (cb: () => void) => { window.addEventListener(EVENTO, cb); window.addEventListener('storage', cb); return () => { window.removeEventListener(EVENTO, cb); window.removeEventListener('storage', cb); }; };
export const useModoTechos = (): ModoTechos => useSyncExternalStore(suscribir, leerModo, () => 'sencillo');
export const esModoSencillo = () => leerModo() === 'sencillo';

/** Interruptor "Sencillo | Experto" de la cabecera. */
export function SelectorModoTechos({ className = '' }: { className?: string }) {
  const modo = useModoTechos();
  return (
    <div className={`flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0 ${className}`} role="radiogroup" aria-label="Modo de Techos">
      {(['sencillo', 'experto'] as const).map(m => (
        <button key={m} type="button" role="radio" aria-checked={modo === m} onClick={() => fijarModoTechos(m)}
          title={m === 'sencillo' ? 'Muestra solo lo necesario, con palabras simples' : 'Muestra todas las opciones técnicas'}
          className={`px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-black cursor-pointer transition-colors ${modo === m ? (m === 'sencillo' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white') : 'text-slate-500 hover:text-slate-800'}`}>
          {m === 'sencillo' ? 'Sencillo' : 'Experto'}
        </button>
      ))}
    </div>
  );
}

/** Palabras del techo explicadas en simple. */
export const GLOSARIO_TECHOS: Record<string, { palabra: string; explica: string }> = {
  luz: { palabra: 'Luz', explica: 'El ancho libre del techo: la distancia entre las columnas de un lado y las del otro.' },
  largo: { palabra: 'Largo', explica: 'Lo que mide el techo de adelante hacia atrás (el fondo).' },
  altura: { palabra: 'Altura de columnas', explica: 'Desde el piso hasta donde empieza el techo.' },
  pendiente: { palabra: 'Pendiente', explica: 'Cuánto se inclina el techo para que corra el agua. 15% = sube 15 cm por cada metro.' },
  flecha: { palabra: 'Flecha', explica: 'Cuánto sube el arco en el centro, desde donde empieza la curva.' },
  tijeral: { palabra: 'Tijeral', explica: 'El triángulo o arco de fierro que forma el techo y lo sostiene de lado a lado.' },
  portico: { palabra: 'Pórtico', explica: 'Un tijeral (o viga) con sus dos columnas. Se repite a lo largo del techo.' },
  correa: { palabra: 'Correa', explica: 'El tubo que va a lo largo, encima de los tijerales, donde se atornilla la calamina.' },
  montante: { palabra: 'Montante', explica: 'Los palitos verticales dentro del tijeral que unen la parte de arriba con la de abajo.' },
  peralte: { palabra: 'Peralte', explica: 'Lo alto (grueso) del tijeral: la distancia entre su tubo de arriba y el de abajo.' },
  arriostre: { palabra: 'Arriostre', explica: 'Refuerzos en cruz (X) que evitan que el techo se mueva de lado con el viento.' },
  cumbrera: { palabra: 'Cumbrera', explica: 'La parte más alta del techo, donde se juntan las dos caídas.' },
  perfil: { palabra: 'Perfil', explica: 'El tipo y la medida del tubo o fierro (por ejemplo, tubo 2"×1" de 2 mm).' },
  // Obra Civil
  zapata: { palabra: 'Zapata', explica: 'El bloque de concreto enterrado bajo cada columna que reparte el peso al suelo.' },
  columna: { palabra: 'Columna', explica: 'El pilar de concreto con fierro que sostiene vigas y techos.' },
  viga: { palabra: 'Viga', explica: 'La pieza horizontal de concreto que une las columnas y carga el techo o la losa.' },
  cimiento: { palabra: 'Cimiento corrido', explica: 'La franja de concreto enterrada bajo los muros, a lo largo de todo el muro.' },
  sobrecimiento: { palabra: 'Sobrecimiento', explica: 'La franja de concreto sobre el cimiento, que sale un poco del piso y protege el muro de la humedad.' },
  losa: { palabra: 'Losa aligerada', explica: 'El techo o entrepiso de concreto con ladrillos de techo (huecos) para que pese menos.' },
  placa: { palabra: 'Placa', explica: 'Un muro de concreto armado (con fierro) que resiste sismos.' },
  encofrado: { palabra: 'Encofrado', explica: 'Los moldes de madera o metal donde se vacía el concreto hasta que endurece.' },
  // Drywall
  rh: { palabra: 'Placa RH', explica: 'Placa verde que resiste la humedad: para baños y cocinas.' },
  rf: { palabra: 'Placa RF', explica: 'Placa rosada que resiste el fuego: para cocinas, cocheras y escapes.' },
  forro: { palabra: 'Forro', explica: 'Drywall pegado a un muro o columna que ya existe, para taparlo o dejarlo liso.' },
  cenefa: { palabra: 'Cenefa', explica: 'Cajón de drywall junto al techo para esconder cortinas o luz LED.' },
  parante: { palabra: 'Parante', explica: 'Los perfiles metálicos verticales dentro del tabique donde se atornillan las placas.' },
};

/** Botoncito "?" que explica una palabra del techo. */
export function QueEs({ termino, className = '' }: { termino: keyof typeof GLOSARIO_TECHOS | string; className?: string }) {
  const g = GLOSARIO_TECHOS[termino];
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);
  if (!g) return null;
  return (
    <span ref={caja} className={`relative inline-flex align-middle ${className}`}>
      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setAbierto(a => !a); }}
        aria-label={`¿Qué es ${g.palabra}?`} title={`¿Qué es ${g.palabra}?`}
        className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center justify-center cursor-pointer">
        <HelpCircle className="w-3 h-3" />
      </button>
      {abierto && (
        <span role="tooltip" className="absolute z-[80] left-1/2 -translate-x-1/2 top-5 w-56 rounded-xl bg-slate-900 text-white text-[11px] font-medium leading-snug p-2.5 shadow-xl normal-case tracking-normal text-left">
          <span className="flex items-start justify-between gap-2"><b className="text-sky-300">{g.palabra}</b>
            <button type="button" onClick={e => { e.stopPropagation(); setAbierto(false); }} aria-label="Cerrar" className="text-white/60 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button></span>
          <span className="block mt-0.5">{g.explica}</span>
        </span>
      )}
    </span>
  );
}

/** Tijerales explicados para quien no es ingeniero (el nombre técnico queda en letra pequeña). */
export const TIJERAL_SENCILLO: Record<string, { titulo: string; para: string }> = {
  escalera_vierendeel: { titulo: 'Tipo escalera', para: 'Fácil de armar en taller; deja espacio libre para luces y cables.' },
  fink: { titulo: 'El más económico', para: 'Usa menos fierro. Lo más común en techos a dos aguas de 6 a 24 m.' },
  pratt: { titulo: 'Para techos grandes', para: 'Aguanta bien en techos anchos o con mucho peso.' },
  howe: { titulo: 'Para carga pesada', para: 'Cuando algo cuelga del techo (tanques, máquinas, tecles).' },
  warren: { titulo: 'Se arma rápido', para: 'Triángulos parejos, sin palitos verticales: menos cortes y soldadura.' },
  parabolico_warren: { titulo: 'Arco clásico', para: 'El arco más usado: triángulos parejos, se arma rápido.' },
  parabolico_pratt: { titulo: 'Arco para techos grandes', para: 'Más firme en arcos anchos o con más peso.' },
  parabolico_bowstring: { titulo: 'Arco con tirante abajo', para: 'Un tubo recto une las columnas y evita que se abran hacia afuera. Bueno si las columnas son delgadas.' },
  simple_arco: { titulo: 'Arco simple (un solo tubo)', para: 'Solo para techos livianos y chicos: cocheras y terrazas de hasta 8 m.' },
};

/** Fila "¿Qué es?" con varias palabras (cada una abre su explicación). */
export function PalabrasQueEs({ terminos, className = '' }: { terminos: (keyof typeof GLOSARIO_TECHOS)[]; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 ${className}`}>
      <span className="font-bold text-slate-400">¿Qué es?</span>
      {terminos.map(t => GLOSARIO_TECHOS[t] && (
        <span key={t} className="inline-flex items-center gap-1 font-semibold text-slate-600">{GLOSARIO_TECHOS[t].palabra}<QueEs termino={t} /></span>
      ))}
    </div>
  );
}
