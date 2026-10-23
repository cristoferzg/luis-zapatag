// Panel Inspector de Propiedades Paramétricas de HERRERÍA
// Edición en tiempo real de piezas CAD individuales (PiezaCad), accesorios (AccesorioCad) y modelo global
import React, { useEffect } from 'react';
import {
  Trash2,
  Info,
  X,
  RotateCw,
  Ruler,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  HerreriaDesign,
  PiezaCad,
  AccesorioCad,
  MaterialFamilia,
  TipoCorteCad,
  TipoRellenoPanel
} from './herreriaTypes';
import { PERFILES_CATALOGO } from './herreriaCatalog';
import { HerreriaPerfilesSelector } from './HerreriaPerfilesSelector';

export type HerreriaSelectedType = 
  | 'pieza_cad'
  | 'tubo_personalizado'
  | 'accesorio_cad'
  | 'marco' 
  | 'hoja' 
  | 'barrotes' 
  | 'arco' 
  | 'chapa' 
  | 'cerrojo' 
  | 'bisagras' 
  | 'panel' 
  | null;

interface HerreriaPropertiesPanelProps {
  design: HerreriaDesign;
  onUpdateDesign: (updated: HerreriaDesign) => void;
  selectedElementId: string | null;
  selectedType: HerreriaSelectedType;
  onClose: () => void;
  isOpenMobile?: boolean;
  onToggleMobile?: () => void;
  onSelectElement?: (id: string | null, type: HerreriaSelectedType) => void;
}

export const HerreriaPropertiesPanel: React.FC<HerreriaPropertiesPanelProps> = ({
  design,
  onUpdateDesign,
  selectedElementId,
  selectedType: _selectedType,
  onSelectElement = () => {},
  onClose,
  isOpenMobile = false,
  onToggleMobile: _onToggleMobile
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Soporte de gesto táctil Swipe-Down en móviles para deslizar hacia abajo y cerrar
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = React.useState(false);
  const touchStartYRef = React.useRef(0);
  const currentDragYRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    currentDragYRef.current = 0;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      currentDragYRef.current = deltaY;
      setDragOffsetY(deltaY);
    } else {
      currentDragYRef.current = 0;
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingSheet(false);
    if (currentDragYRef.current > 70) {
      // Si se deslizó más de 70px hacia abajo, cerrar el inspector móvil
      setDragOffsetY(0);
      onClose();
    } else {
      // Retornar suavemente a la posición abierta
      setDragOffsetY(0);
    }
  };

  // Si se selecciona un elemento o se abre en móvil, asegurarse de que no esté colapsado
  useEffect(() => {
    if (selectedElementId) {
      setIsCollapsed(false);
    }
  }, [selectedElementId]);
  const piezas = design.piezas || [];
  const accesorios = design.accesoriosCad || [];

  // Buscar pieza seleccionada
  const piezaSeleccionada = piezas.find(p => p.id === selectedElementId);
  const accesorioSeleccionado = accesorios.find(a => a.id === selectedElementId);

  // Actualizar pieza seleccionada
  const updatePieza = (changes: Partial<PiezaCad>) => {
    if (!piezaSeleccionada) return;
    const updated = { ...piezaSeleccionada, ...changes };
    // Si cambiaron coordenadas, recalcular longitud
    if (changes.x1 !== undefined || changes.y1 !== undefined || changes.x2 !== undefined || changes.y2 !== undefined) {
      const x1 = changes.x1 ?? updated.x1;
      const y1 = changes.y1 ?? updated.y1;
      const x2 = changes.x2 ?? updated.x2;
      const y2 = changes.y2 ?? updated.y2;
      updated.longitudM = Math.round(Math.hypot(x2 - x1, y2 - y1) * 1000) / 1000;
    }
    onUpdateDesign({
      ...design,
      piezas: piezas.map(p => p.id === piezaSeleccionada.id ? updated : p)
    });
  };

  // Actualizar longitud forzada manteniendo ángulo
  const handleSetLongitud = (nuevaLongM: number) => {
    if (!piezaSeleccionada || nuevaLongM <= 0) return;
    const dx = piezaSeleccionada.x2 - piezaSeleccionada.x1;
    const dy = piezaSeleccionada.y2 - piezaSeleccionada.y1;
    const curLen = Math.hypot(dx, dy);
    if (curLen > 0.001) {
      const factor = nuevaLongM / curLen;
      updatePieza({
        x2: Math.round((piezaSeleccionada.x1 + dx * factor) * 1000) / 1000,
        y2: Math.round((piezaSeleccionada.y1 + dy * factor) * 1000) / 1000,
        longitudM: nuevaLongM
      });
    } else {
      updatePieza({
        x2: Math.round((piezaSeleccionada.x1 + nuevaLongM) * 1000) / 1000,
        longitudM: nuevaLongM
      });
    }
  };

  // Eliminar pieza
  const handleEliminarPieza = () => {
    if (!piezaSeleccionada) return;
    onUpdateDesign({
      ...design,
      piezas: piezas.filter(p => p.id !== piezaSeleccionada.id)
    });
    onClose();
  };

  // Orden de dibujo (adelante/atrás): el orden del array define quién se dibuja
  // encima. Al final = al frente; al inicio = al fondo.
  const reordenarPieza = (modo: 'frente' | 'fondo' | 'subir' | 'bajar') => {
    if (!piezaSeleccionada) return;
    const idx = piezas.findIndex(p => p.id === piezaSeleccionada.id);
    if (idx < 0) return;
    const arr = [...piezas];
    const [item] = arr.splice(idx, 1);
    if (modo === 'frente') arr.push(item);
    else if (modo === 'fondo') arr.unshift(item);
    else if (modo === 'subir') arr.splice(Math.min(idx + 1, arr.length), 0, item);
    else arr.splice(Math.max(idx - 1, 0), 0, item);
    onUpdateDesign({ ...design, piezas: arr });
  };

  // Actualizar accesorio
  const updateAccesorio = (changes: Partial<AccesorioCad>) => {
    if (!accesorioSeleccionado) return;
    onUpdateDesign({
      ...design,
      accesoriosCad: accesorios.map(a => a.id === accesorioSeleccionado.id ? { ...a, ...changes } : a)
    });
  };

  // Eliminar accesorio
  const handleEliminarAccesorio = () => {
    if (!accesorioSeleccionado) return;
    onUpdateDesign({
      ...design,
      accesoriosCad: accesorios.filter(a => a.id !== accesorioSeleccionado.id)
    });
    onClose();
  };

  const renderContenido = () => {
    // 1. SI SE SELECCIONÓ UNA PIEZA CAD
    if (piezaSeleccionada) {
      const perfil = PERFILES_CATALOGO.find(p => p.id === piezaSeleccionada.perfilId) || PERFILES_CATALOGO[0];

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-xs">
                {piezaSeleccionada.marca}
              </span>
              <div>
                <span className="font-bold text-slate-800 text-xs block truncate max-w-[140px]">
                  {piezaSeleccionada.nombre}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {perfil.dimensiones}
                </span>
              </div>
            </div>
            <button
              onClick={handleEliminarPieza}
              className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Eliminar Pieza"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* ORDEN DE DIBUJO (adelante / atrás) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-0.5">Orden:</span>
            <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <button onClick={() => reordenarPieza('fondo')} title="Enviar al fondo"
                className="flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer">
                <ChevronsDown className="w-4 h-4" />
              </button>
              <button onClick={() => reordenarPieza('bajar')} title="Enviar atrás"
                className="flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => reordenarPieza('subir')} title="Traer adelante"
                className="flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => reordenarPieza('frente')} title="Traer al frente"
                className="flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer">
                <ChevronsUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MATERIAL DE ACABADO (3D): metal, madera, mármol, vidrio… */}
          <div>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1">Material / acabado (3D)</label>
            <select
              value={piezaSeleccionada.acabadoMaterial || 'acero'}
              onChange={e => updatePieza({ acabadoMaterial: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-semibold focus:border-blue-600 cursor-pointer"
            >
              <optgroup label="Metales">
                <option value="acero">Acero</option>
                <option value="aluminio">Aluminio</option>
                <option value="inox">Acero inoxidable</option>
                <option value="laton">Latón</option>
                <option value="cobre">Cobre</option>
                <option value="cromo">Cromado</option>
              </optgroup>
              <optgroup label="Maderas / tableros">
                <option value="madera">Madera oscura</option>
                <option value="madera_clara">Madera clara</option>
                <option value="mdf">MDF</option>
                <option value="melamina">Melamina</option>
              </optgroup>
              <optgroup label="Otros">
                <option value="marmol">Mármol</option>
                <option value="concreto">Concreto</option>
                <option value="vidrio">Vidrio</option>
              </optgroup>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Cambia solo la apariencia en el 3D (ideal para muebles). No altera la familia estructural ni el precio.</p>
          </div>

          {/* Nombre / Descripción */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase tracking-wider">Identificador</label>
            <input
              type="text"
              value={piezaSeleccionada.nombre}
              onChange={e => updatePieza({ nombre: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Perfil Comercial */}
          <HerreriaPerfilesSelector
            selectedProfileId={piezaSeleccionada.perfilId}
            onSelectProfile={(newProfileId) => updatePieza({ perfilId: newProfileId })}
            title="Seleccionar Perfil Metálico"
          />

          {/* ========================================================
              GIRO Y ORIENTACIÓN DE SECCIÓN DE PERFIL METÁLICO (ANCHO vs ALTO)
          ======================================================== */}
          {perfil.categoria !== 'tubo_redondo' && (
            <div className="bg-white border border-slate-100 p-3 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                  Orientación
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  (piezaSeleccionada.rotacionDeg || 0) % 180 === 90
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {(piezaSeleccionada.rotacionDeg || 0) % 180 === 90 ? 'CANTO' : 'CARA'}
                </span>
              </div>

              {/* Botón interactivo de 1 clic para alternar Cara / Canto (0° vs 90°) */}
              <button
                type="button"
                onClick={() => {
                  const cur = piezaSeleccionada.rotacionDeg || 0;
                  const next = (cur + 90) % 360;
                  updatePieza({ rotacionDeg: next });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar Sección 90°</span>
              </button>

              {/* Selector rápido de ángulos de giro */}
              <div className="grid grid-cols-4 gap-1">
                {[0, 90, 180, 270].map(deg => {
                  const isActive = (piezaSeleccionada.rotacionDeg || 0) % 360 === deg;
                  return (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => updatePieza({ rotacionDeg: deg })}
                      className={`py-1 rounded-md text-[10px] font-bold border transition-all ${
                        isActive
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                      title={`Girar ${deg} grados`}
                    >
                      {deg}°
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Material */}
          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase tracking-wider">Material</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['acero', 'aluminio', 'acero_inoxidable'] as MaterialFamilia[]).map(mat => (
                <button
                  key={mat}
                  onClick={() => updatePieza({ material: mat })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    piezaSeleccionada.material === mat
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mat === 'acero_inoxidable' ? 'Inox' : mat}
                </button>
              ))}
            </div>
          </div>

          {/* Medida Paramétrica Directa */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
              <span className="flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                Longitud de Corte:
              </span>
              <span className="font-mono text-sm font-bold text-blue-700">
                {(piezaSeleccionada.longitudM * 1000).toFixed(0)} mm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={piezaSeleccionada.longitudM}
                onChange={e => handleSetLongitud(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs font-bold text-blue-800">m</span>
            </div>
          </div>

          {/* Coordenadas de los Extremos */}
          <div className="grid grid-cols-2 gap-2">
            {/* Punto Inicio */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Punto 1 (Inicio)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">X:</span>
                <input
                  type="number"
                  step="0.05"
                  value={piezaSeleccionada.x1}
                  onChange={e => updatePieza({ x1: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-800 font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Y:</span>
                <input
                  type="number"
                  step="0.05"
                  value={piezaSeleccionada.y1}
                  onChange={e => updatePieza({ y1: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-800 font-mono text-xs"
                />
              </div>
            </div>

            {/* Punto Fin */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Punto 2 (Fin)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">X:</span>
                <input
                  type="number"
                  step="0.05"
                  value={piezaSeleccionada.x2}
                  onChange={e => updatePieza({ x2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-800 font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Y:</span>
                <input
                  type="number"
                  step="0.05"
                  value={piezaSeleccionada.y2}
                  onChange={e => updatePieza({ y2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-800 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cortes en Extremos */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-1">Corte Inicio</label>
              <select
                value={piezaSeleccionada.corteInicio}
                onChange={e => updatePieza({ corteInicio: e.target.value as TipoCorteCad })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs shadow-xs"
              >
                <option value="90°">90° Recto</option>
                <option value="45°">45° Inglete</option>
                <option value="otro">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-1">Corte Fin</label>
              <select
                value={piezaSeleccionada.corteFin}
                onChange={e => updatePieza({ corteFin: e.target.value as TipoCorteCad })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs shadow-xs"
              >
                <option value="90°">90° Recto</option>
                <option value="45°">45° Inglete</option>
                <option value="otro">Personalizado</option>
              </select>
            </div>
          </div>

          {/* Conversión y Propiedades de Tubo Curvo / Arco */}
          {!piezaSeleccionada.esPlancha && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const nuevoEsCurvo = !piezaSeleccionada.esCurvo;
                  updatePieza({
                    esCurvo: nuevoEsCurvo,
                    flechaM: nuevoEsCurvo ? (piezaSeleccionada.flechaM || 0.35) : undefined,
                    tipo: nuevoEsCurvo ? 'tubo_curvo' : 'perfil'
                  });
                }}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  piezaSeleccionada.esCurvo
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <span>{piezaSeleccionada.esCurvo ? '✓ Perfil Curvo Rolado (Activado)' : 'Convertir a Perfil Curvo / Arco'}</span>
              </button>

              {piezaSeleccionada.esCurvo && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">Flecha / Altura de Curvatura:</span>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                      {((piezaSeleccionada.flechaM || 0.35) * 100).toFixed(0)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.50"
                    step="0.05"
                    value={piezaSeleccionada.flechaM || 0.35}
                    onChange={e => updatePieza({ flechaM: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updatePieza({ flechaM: -Math.abs(piezaSeleccionada.flechaM || 0.35) })}
                      className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-semibold text-amber-900 transition-colors"
                    >
                      Invertir Curvatura
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePieza({ flechaM: Math.abs(piezaSeleccionada.flechaM || 0.35) })}
                      className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-semibold text-amber-900 transition-colors"
                    >
                      Curva Normal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Si es plancha */}
          {piezaSeleccionada.esPlancha && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1">Subtipo de Plancha</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {[
                    { id: 'lisa', label: 'Lisa' },
                    { id: 'acanalada', label: 'Acanalada / Corrugada' },
                    { id: 'machihembrada', label: 'Machihembrada' },
                    { id: 'estriada', label: 'Estriada' },
                    { id: 'perforada', label: 'Perforada' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => updatePieza({ subtipoPlancha: sub.id as any, nombre: `Plancha ${sub.label} (${(piezaSeleccionada.anchoPlanchaM || 1).toFixed(2)}m x ${(piezaSeleccionada.altoPlanchaM || 1).toFixed(2)}m)` })}
                      className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                        (piezaSeleccionada.subtipoPlancha || 'lisa') === sub.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pernos en esquinas (desactivado por defecto) */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase tracking-wider">Fijaciones</span>
                <button
                  type="button"
                  onClick={() => updatePieza({ conPernos: !piezaSeleccionada.conPernos })}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-between transition-all ${
                    piezaSeleccionada.conPernos
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Pernos en Esquinas</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    piezaSeleccionada.conPernos ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {piezaSeleccionada.conPernos ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase tracking-wider">Espesor</label>
                <select
                  value={piezaSeleccionada.espesorPlanchaMm || 3.0}
                  onChange={e => updatePieza({ espesorPlanchaMm: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-medium"
                >
                  <option value={1.5}>1.5 mm (Cal. 16)</option>
                  <option value={2.0}>2.0 mm (Cal. 14)</option>
                  <option value={3.0}>3.0 mm (1/8" Estándar)</option>
                  <option value={4.5}>4.5 mm (3/16" Pesada)</option>
                  <option value={6.0}>6.0 mm (1/4" Estructural)</option>
                </select>
              </div>

              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Tipo de Relleno</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['plancha', 'malla', 'vidrio'] as TipoRellenoPanel[]).map(tipoR => (
                  <button
                    key={tipoR}
                    onClick={() => updatePieza({ tipoRelleno: tipoR })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      piezaSeleccionada.tipoRelleno === tipoR
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tipoR}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. SI SE SELECCIONÓ UN ACCESORIO
    if (accesorioSeleccionado) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-800 text-xs">
              {accesorioSeleccionado.nombre}
            </span>
            <button
              onClick={handleEliminarAccesorio}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="Eliminar Accesorio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1">Nombre</label>
            <input
              type="text"
              value={accesorioSeleccionado.nombre}
              onChange={e => updateAccesorio({ nombre: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1">Especificación</label>
            <textarea
              rows={2}
              value={accesorioSeleccionado.especificacion || ''}
              onChange={e => updateAccesorio({ especificacion: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">Posición X (m)</label>
              <input
                type="number"
                step="0.05"
                value={accesorioSeleccionado.x}
                onChange={e => updateAccesorio({ x: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">Posición Y (m)</label>
              <input
                type="number"
                step="0.05"
                value={accesorioSeleccionado.y}
                onChange={e => updateAccesorio({ y: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1">Precio Unitario Estimado (S/.)</label>
            <input
              type="number"
              step="0.50"
              value={accesorioSeleccionado.precioUnitario || 0}
              onChange={e => updateAccesorio({ precioUnitario: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs text-emerald-700 font-bold"
            />
          </div>
        </div>
      );
    }

    // 3. SI NO HAY NADA SELECCIONADO: RESUMEN GLOBAL DEL PROYECTO CAD
    const totalMetrosLineales = piezas.reduce((acc, pz) => acc + (pz.longitudM || 0), 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-800 text-xs">
          <Info className="w-4 h-4 text-blue-600" />
          <span>PROPIEDADES DEL PROYECTO CAD</span>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">Nombre del Proyecto</label>
          <input
            type="text"
            value={design.nombre}
            onChange={e => onUpdateDesign({ ...design, nombre: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold text-xs focus:border-blue-600"
          />
        </div>

        {/* Resumen Métrico */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Total Piezas</span>
            <span className="text-base font-mono font-bold text-blue-600">{piezas.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Metros de Perfil</span>
            <span className="text-base font-mono font-bold text-emerald-600">{totalMetrosLineales.toFixed(2)} m</span>
          </div>
        </div>

        {/* GRUPOS DE PIEZAS (ver / seleccionar / eliminar en conjunto, como Techos) */}
        {piezas.length > 0 && (() => {
          const LABELS: Record<string, string> = { marco: 'Marco perimetral', relleno: 'Relleno / barrotes', estructura: 'Estructura', arco: 'Arco', panel: 'Panel / chapa' };
          const COLORS: Record<string, string> = { marco: 'bg-blue-500', relleno: 'bg-emerald-500', estructura: 'bg-amber-500', arco: 'bg-purple-500', panel: 'bg-sky-500' };
          const counts: Record<string, number> = {};
          piezas.forEach(p => { const g = (p as any).grupo || 'sueltas'; counts[g] = (counts[g] || 0) + 1; });
          const grupos = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-600 font-bold uppercase tracking-wide">Grupos de piezas</label>
                <span className="text-[10px] text-slate-400 font-semibold">{grupos.length} grupo(s)</span>
              </div>
              <div className="space-y-1.5">
                {grupos.map(([g, n]) => (
                  <div key={g} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLORS[g] || 'bg-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 block truncate">{LABELS[g] || (g === 'sueltas' ? 'Piezas sueltas' : g)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{n} pieza{n !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => {
                        const first = piezas.find(p => ((p as any).grupo || 'sueltas') === g);
                        if (first) onSelectElement(first.id, 'pieza_cad');
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer shrink-0"
                      title="Ver una pieza de este grupo"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar las ${n} piezas del grupo "${LABELS[g] || g}"? Esta acción se puede deshacer con Ctrl+Z.`)) {
                          onUpdateDesign({ ...design, piezas: piezas.filter(p => ((p as any).grupo || 'sueltas') !== g) });
                        }
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                      title="Eliminar todo el grupo"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* MATERIAL GENERAL (3D): aplica a TODAS las piezas de un toque */}
        {piezas.length > 0 && (
          <div>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1">Material general (3D)</label>
            <select
              defaultValue=""
              onChange={e => {
                const m = e.target.value;
                if (!m) return;
                onUpdateDesign({ ...design, piezas: piezas.map(p => ({ ...p, acabadoMaterial: m })) });
              }}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-semibold focus:border-blue-600 cursor-pointer"
            >
              <option value="">— Aplicar a todas las piezas —</option>
              <optgroup label="Metales">
                <option value="acero">Acero</option>
                <option value="aluminio">Aluminio</option>
                <option value="inox">Acero inoxidable</option>
                <option value="laton">Latón</option>
                <option value="cobre">Cobre</option>
                <option value="cromo">Cromado</option>
              </optgroup>
              <optgroup label="Maderas / tableros">
                <option value="madera">Madera oscura</option>
                <option value="madera_clara">Madera clara</option>
                <option value="mdf">MDF</option>
                <option value="melamina">Melamina</option>
              </optgroup>
              <optgroup label="Otros">
                <option value="marmol">Mármol</option>
                <option value="concreto">Concreto</option>
                <option value="vidrio">Vidrio</option>
              </optgroup>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Pinta todas las piezas con ese material en el 3D (para muebles, barandas, etc.). Puedes afinar pieza por pieza seleccionándola.</p>
          </div>
        )}

        {/* Acabado y Pintura */}
        <div className="space-y-2">
          <label className="text-[11px] text-slate-600 font-semibold block">Color de Acabado Metal</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={design.acabado.colorHex}
              onChange={e => onUpdateDesign({
                ...design,
                acabado: { ...design.acabado, colorHex: e.target.value }
              })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
            />
            <input
              type="text"
              value={design.acabado.colorNombre}
              onChange={e => onUpdateDesign({
                ...design,
                acabado: { ...design.acabado, colorNombre: e.target.value }
              })}
              className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-medium"
            />
          </div>
        </div>

        {/* Tip Informativo */}
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-slate-600 text-[11px] leading-relaxed space-y-1.5">
          <p>
            💡 <b className="text-blue-700">Toca cualquier pieza</b> en el lienzo 2D para ver sus coordenadas exactas, longitud de corte a 45°/90°, y cambiar su perfil tubular.
          </p>
          <p>
            📐 Todas las piezas modeladas se actualizan instantáneamente en el visor 3D, la lista de cortes y el presupuesto.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Panel Lateral para Escritorio (Desktop lg+) */}
      {!isCollapsed && (
        <div className="hidden lg:flex w-80 shrink-0 h-full flex-col bg-white border-l border-slate-200 text-slate-700 text-xs select-none overflow-y-auto p-4 shadow-xs relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inspector CAD</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsCollapsed(true);
                  onClose();
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title="Cerrar Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {renderContenido()}
        </div>
      )}

      {/* Backdrop oscuro translúcido en móvil */}
      {isOpenMobile && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 animate-in fade-in duration-200"
        />
      )}

      {/* Drawer Inferior para Dispositivos Móviles y Tablets (< lg) con gesto Swipe-Down */}
      <div
        style={{
          transform: isOpenMobile
            ? (isDraggingSheet && dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : 'translateY(0)')
            : 'translateY(100%)',
          transition: isDraggingSheet ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-300 shadow-2xl rounded-t-3xl flex flex-col max-h-[82vh] pointer-events-auto select-none`}
      >
        {/* Barra superior de agarre / Drag Handle para deslizar hacia abajo */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2.5 px-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl cursor-grab active:cursor-grabbing flex flex-col items-center select-none touch-none"
        >
          {/* Píldora de arrastre visual */}
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mb-2 transition-colors" />
          
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                {piezaSeleccionada ? `PIEZA: ${piezaSeleccionada.marca}` : (accesorioSeleccionado ? `ACCESORIO: ${accesorioSeleccionado.nombre}` : 'INSPECTOR CAD PARAMÉTRICO')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">Desliza abajo para cerrar</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title="Cerrar Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto bg-white pb-12 flex-1 overscroll-contain">
          {renderContenido()}
        </div>
      </div>
    </>
  );
};
