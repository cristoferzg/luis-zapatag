import React, { useState, useEffect } from 'react';
import { 
  SteelMaterial,
  DireccionCaida,
  TipoTijeral,
  PatronTijeral
} from './structuralTypes';
import { STEEL_PROFILES, getProfileById } from './structuralCatalog';
import { 
  Check, 
  Trash2, 
  Copy, 
  X, 
  Lock,
  Unlock,
  Sparkles,
  Link2
} from 'lucide-react';

export type SelectedItemType = 'column' | 'beam' | 'purlin' | 'truss' | 'brace' | 'sector' | 'edge' | 'vertex' | 'void';

interface SingleElementPropertiesProps {
  selectedItem: {
    type: SelectedItemType | string;
    item: any;
  } | null;
  onUpdateItem: (updatedItem: any, type: string) => void;
  onDeleteItem: (id: string, type: string) => void;
  onDuplicateItem?: (item: any, type: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export const SingleElementProperties: React.FC<SingleElementPropertiesProps> = ({
  selectedItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onClose,
  isMobile = false
}) => {
  if (!selectedItem) return null;

  const { type, item } = selectedItem;

  // Local state for immediate responsiveness
  const [profileId, setProfileId] = useState<string>(item.profileId || 'tub-cuad-100x100x3');
  const [material, setMaterial] = useState<SteelMaterial>(item.material || 'A500 Gr. B');
  const [altura, setAltura] = useState<number>(item.altura ?? 3.5);
  const [posX, setPosX] = useState<number>(item.x ?? item.startNode?.x ?? 0);
  const [posY, setPosY] = useState<number>(item.y ?? item.startNode?.y ?? 0);
  const [posZ, setPosZ] = useState<number>(item.baseZ ?? item.startNode?.z ?? 0);
  const [tag, setTag] = useState<string>(item.tag || item.nombre || 'ELEM');
  const [basePlate, setBasePlate] = useState<boolean>(item.basePlate ?? true);
  const [anchorBolts, setAnchorBolts] = useState<number>(item.anchorBoltsCount || 4);
  const [isLocked, setIsLocked] = useState<boolean>(item.isLocked || false);
  const [notice, setNotice] = useState<string | null>(null);

  // Truss-specific state
  const [trussHeight, setTrussHeight] = useState<number>(item.trussHeight || 0.80);
  const [tipoTijeral, setTipoTijeral] = useState<TipoTijeral>(item.tipoTijeral || 'dos_aguas');
  const [patronTijeral, setPatronTijeral] = useState<PatronTijeral>(item.patronTijeral || 'warren');

  // Sector specific
  const [sectorSlope, setSectorSlope] = useState<number>(item.pendientePct ?? 10.0);
  const [sectorDir, setSectorDir] = useState<DireccionCaida>(item.direccionCaida || 'calle');
  const [sectorHAlto, setSectorHAlto] = useState<number>(item.alturaLadoAlto ?? 3.8);
  const [sectorHBajo, setSectorHBajo] = useState<number>(item.alturaLadoBajo ?? 3.0);
  const [acopladoAlTecho, setAcopladoAlTecho] = useState<boolean>(item.acopladoAlTecho !== false);
  const [esTranslucido, setEsTranslucido] = useState<boolean>(item.esTranslucido || false);
  const [colorTranslucido, setColorTranslucido] = useState<string>(item.colorTranslucido || 'Verde');
  const [tipoTranslucido, setTipoTranslucido] = useState<string>(item.tipoTranslucido || 'policarbonato_alveolar');

  // Update local state when selected item changes
  useEffect(() => {
    setProfileId(item.profileId || 'tub-cuad-100x100x3');
    setMaterial(item.material || 'A500 Gr. B');
    setAltura(item.altura ?? 3.5);
    setPosX(item.x ?? item.startNode?.x ?? 0);
    setPosY(item.y ?? item.startNode?.y ?? 0);
    setPosZ(item.baseZ ?? item.startNode?.z ?? 0);
    setTag(item.tag || item.nombre || 'ELEM');
    setBasePlate(item.basePlate ?? true);
    setAnchorBolts(item.anchorBoltsCount || 4);
    setIsLocked(item.isLocked || false);
    if (item.trussHeight) setTrussHeight(item.trussHeight);
    if (item.tipoTijeral) setTipoTijeral(item.tipoTijeral);
    if (item.patronTijeral) setPatronTijeral(item.patronTijeral);
    if (item.pendientePct !== undefined) setSectorSlope(item.pendientePct);
    if (item.direccionCaida) setSectorDir(item.direccionCaida);
    if (item.alturaLadoAlto !== undefined) setSectorHAlto(item.alturaLadoAlto);
    if (item.alturaLadoBajo !== undefined) setSectorHBajo(item.alturaLadoBajo);
    setAcopladoAlTecho(item.acopladoAlTecho !== false);
    setEsTranslucido(item.esTranslucido || false);
    setColorTranslucido(item.colorTranslucido || 'Verde');
    setTipoTranslucido(item.tipoTranslucido || 'policarbonato_alveolar');
  }, [item, type]);

  const activeProfile = getProfileById(profileId);

  // Handle Save / Apply changes
  const handleApply = () => {
    let updated = { ...item, tag, isLocked };

    if (type === 'column') {
      updated = {
        ...updated,
        x: posX,
        y: posY,
        baseZ: posZ,
        altura: altura,
        profileId,
        material,
        basePlate,
        anchorBoltsCount: anchorBolts,
        isCustom: true
      };
    } else if (type === 'beam' || type === 'truss' || type === 'brace') {
      const dx = (item.endNode?.x || 0) - (item.startNode?.x || 0);
      const dy = (item.endNode?.y || 0) - (item.startNode?.y || 0);
      updated = {
        ...updated,
        startNode: { x: posX, y: posY, z: posZ },
        endNode: { x: posX + dx, y: posY + dy, z: posZ },
        profileId,
        material,
        trussHeight: type === 'truss' ? trussHeight : undefined,
        tipoTijeral: type === 'truss' ? tipoTijeral : undefined,
        patronTijeral: type === 'truss' ? patronTijeral : undefined
      };
    } else if (type === 'purlin') {
      updated = {
        ...updated,
        profileId,
        material
      };
    } else if (type === 'sector') {
      const transColor = colorTranslucido === 'Azul' ? '#0284c7' : colorTranslucido === 'Blanco' ? '#94a3b8' : colorTranslucido === 'Cristal' ? '#06b6d4' : '#10b981';
      updated = {
        ...updated,
        nombre: tag,
        pendientePct: sectorSlope,
        direccionCaida: sectorDir,
        alturaLadoAlto: sectorHAlto,
        alturaLadoBajo: sectorHBajo,
        acopladoAlTecho: acopladoAlTecho,
        esTranslucido: esTranslucido,
        colorTranslucido: esTranslucido ? colorTranslucido : undefined,
        tipoTranslucido: esTranslucido ? tipoTranslucido : undefined,
        color: esTranslucido ? transColor : (item.color || '#2563eb'),
        materialCobertura: esTranslucido ? 'Policarbonato' : item.materialCobertura
      };
    } else if (type === 'void') {
      updated = {
        ...updated,
        nombre: tag
      };
    }

    onUpdateItem(updated, type);
    setNotice('✓ Cambios aplicados');
    setTimeout(() => setNotice(null), 2000);
  };

  const getElementTypeName = () => {
    switch (type) {
      case 'column': return 'COLUMNA';
      case 'beam': return 'VIGA';
      case 'purlin': return 'CORREA';
      case 'truss': return 'TIJERAL';
      case 'brace': return 'ARRIOSTRE';
      case 'sector': return 'SECTOR DE TECHO';
      case 'void': return 'VACÍO / PATIO';
      case 'edge': return 'BORDE / TRAMO';
      case 'vertex': return 'VÉRTICE';
      default: return 'ELEMENTO';
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-slate-200 shadow-xl overflow-hidden transition-all ${
      isMobile 
        ? 'w-full max-h-[80vh] rounded-t-2xl' 
        : 'w-80 rounded-2xl'
    }`}>
      
      {/* Mobile Drag Handle */}
      {isMobile && (
        <div className="w-full flex items-center justify-center pt-2 pb-1 cursor-grab">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {getElementTypeName()}
            </span>
            <h3 className="text-sm font-extrabold text-white leading-tight">
              {tag}
            </h3>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLocked ? 'text-amber-400 bg-amber-950/60' : 'text-slate-400 hover:text-white'
            }`}
            title={isLocked ? 'Elemento bloqueado' : 'Bloquear elemento'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar propiedades"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Focused properties */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700 flex-1">
        
        {/* 1. Tag / Label */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Identificador / Etiqueta
          </label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* 2. Steel Profile (if applicable) */}
        {(type === 'column' || type === 'beam' || type === 'purlin' || type === 'truss' || type === 'brace') && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Perfil Estructural
            </label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
            >
              <optgroup label="Tubos Cuadrados (Columnas / Tijerales)">
                {STEEL_PROFILES.filter(p => p.type === 'Tubo Cuadrado' || p.type === 'tubular_cuadrado').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.weightKgM} kg/m)</option>
                ))}
              </optgroup>
              <optgroup label="Tubos Rectangulares (Vigas / Dinteles)">
                {STEEL_PROFILES.filter(p => p.type === 'Tubo Rectangular' || p.type === 'tubular_rectangular').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.weightKgM} kg/m)</option>
                ))}
              </optgroup>
              <optgroup label="Costaneras C (Correas)">
                {STEEL_PROFILES.filter(p => p.type === 'Perfil C (Costanera)' || p.type === 'perfil_c').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.weightKgM} kg/m)</option>
                ))}
              </optgroup>
              <optgroup label="Vigas IPE / W (Estructura Pesada)">
                {STEEL_PROFILES.filter(p => p.type === 'IPE' || p.type === 'W' || p.type === 'perfil_w_h').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.weightKgM} kg/m)</option>
                ))}
              </optgroup>
            </select>
            {activeProfile && (
              <div className="mt-1 px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-500 font-mono flex justify-between">
                <span>{activeProfile.heightMm}×{activeProfile.widthMm}×{activeProfile.thicknessMm}mm</span>
                <span className="font-bold text-blue-700">{activeProfile.weightKgM} kg/m</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Material */}
        {(type === 'column' || type === 'beam' || type === 'purlin' || type === 'truss' || type === 'brace') && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Calidad de Acero (Material)
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as SteelMaterial)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="A500 Gr. B">ASTM A500 Gr. B (Estructural Tubular Fy=3,200 kg/cm²)</option>
              <option value="A36">ASTM A36 (Acero Estándar Fy=2,530 kg/cm²)</option>
              <option value="A572 Gr. 50">ASTM A572 Gr. 50 (Alta Resistencia Fy=3,515 kg/cm²)</option>
              <option value="Galvanizado">Acero Galvanizado en Caliente (Anticorrosivo)</option>
            </select>
          </div>
        )}

        {/* 4. Altura / Dimensiones & Slenderness Verification */}
        {type === 'column' && (() => {
          const Ag = activeProfile?.areaCm2 || ((activeProfile?.weightKgM || 5) / 0.785);
          const rx = Math.sqrt(Math.max(0.1, activeProfile?.IxCm4 || 1) / Math.max(0.1, Ag));
          const lambda = (1.5 * (altura * 100)) / Math.max(0.5, rx);
          const isCritical = lambda > 200;
          const isWarning = lambda > 160 && !isCritical;

          return (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Altura de Columna (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={altura === 0 ? '' : altura}
                  onChange={(e) => setAltura(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  onBlur={handleApply}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Slenderness & Buckling Alert Banner */}
              {isCritical ? (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>⚠️ Alerta de Pandeo: Esbeltez λ = {lambda.toFixed(0)}</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-tight">
                    El tubo es muy delgado para una altura de <strong>{altura}m</strong> (supera el límite normativo de λ ≤ 200). Se doblará ante cargas de viento y peso propio.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileId('tub-cuad-100x100x3');
                      handleApply();
                    }}
                    className="w-full py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Acoplar a Tubo Cuadrado 100×100×3mm
                  </button>
                </div>
              ) : isWarning ? (
                <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <span>⚠️ Advertencia de Esbeltez (λ = {lambda.toFixed(0)})</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Columna cerca del límite de flexibilidad. Considerar aumentar sección o colocar arriostres.
                  </p>
                </div>
              ) : (
                <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] font-bold flex items-center justify-between">
                  <span>Esbeltez E.090: λ = {lambda.toFixed(0)} (Seguro)</span>
                  <span className="text-[9px] uppercase bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-900">OK</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Level Placement for Purlins and Beams (Red line alignment vs ceiling) */}
        {(type === 'purlin' || type === 'beam') && (
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Nivel de Colocación en Altura
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setPosZ(3.5);
                  handleApply();
                }}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                ▲ Sobre Cuerda Superior (Aluzinc)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPosZ(3.0);
                  handleApply();
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                ▼ Cuerda Inferior (Cielo Raso)
              </button>
            </div>
          </div>
        )}

        {/* 5. Coordenadas X, Y, Z */}
        {(type === 'column' || type === 'beam' || type === 'truss') && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">X (m)</label>
              <input
                type="number"
                step="0.05"
                value={posX === 0 ? '' : posX}
                onChange={(e) => setPosX(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Y (m)</label>
              <input
                type="number"
                step="0.05"
                value={posY === 0 ? '' : posY}
                onChange={(e) => setPosY(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Z (m)</label>
              <input
                type="number"
                step="0.05"
                value={posZ === 0 ? '' : posZ}
                onChange={(e) => setPosZ(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
              />
            </div>
          </div>
        )}

        {/* 6. Column Base Plate & Anchor Bolts */}
        {type === 'column' && (
          <div className="pt-1 border-t border-slate-100 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={basePlate}
                onChange={(e) => setBasePlate(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="font-bold text-xs text-slate-800">Placa Base de Anclaje</span>
            </label>

            {basePlate && (
              <div className="flex items-center justify-between pl-6 text-xs text-slate-600">
                <span>Pernos de anclaje:</span>
                <select
                  value={anchorBolts}
                  onChange={(e) => setAnchorBolts(parseInt(e.target.value) || 4)}
                  className="p-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                >
                  <option value={4}>4 pernos Ø5/8"</option>
                  <option value={6}>6 pernos Ø3/4"</option>
                  <option value={8}>8 pernos Ø3/4"</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 7. Truss Specific Settings */}
        {type === 'truss' && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Peralte / Altura Tijeral (m)</label>
              <input
                type="number"
                step="0.05"
                value={trussHeight}
                onChange={(e) => setTrussHeight(parseFloat(e.target.value) || 0.8)}
                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Patrón de Celosía</label>
              <select
                value={patronTijeral}
                onChange={(e) => setPatronTijeral(e.target.value as PatronTijeral)}
                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
              >
                <option value="warren">Warren (Diagonales V)</option>
                <option value="pratt">Pratt (Montantes + Diagonales)</option>
                <option value="howe">Howe (Diagonales a compresión)</option>
              </select>
            </div>
          </div>
        )}

        {/* 8. Sector Properties */}
        {type === 'sector' && (
          <div className="space-y-3">
            {/* Acople al plano del techo */}
            <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Acoplar al Plano del Techo</span>
                </span>
                <input
                  type="checkbox"
                  checked={acopladoAlTecho}
                  onChange={(e) => setAcopladoAlTecho(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </label>
              <p className="text-[10px] text-blue-700 leading-tight">
                {acopladoAlTecho 
                  ? '✓ Pendiente y altura sincronizadas con el techo principal sin desniveles ni descuadres.' 
                  : 'Modo independiente: permite definir alturas y pendiente aisladas.'}
              </p>
            </div>

            {/* Cobertura Translúcida (Policarbonato) */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              esTranslucido ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="flex items-center justify-between cursor-pointer mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${esTranslucido ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={esTranslucido ? 'text-emerald-900 font-black' : ''}>
                    Cobertura Translúcida (Policarbonato)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={esTranslucido}
                  onChange={(e) => setEsTranslucido(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </label>

              {esTranslucido && (
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Tonalidad</label>
                    <select
                      value={colorTranslucido}
                      onChange={(e) => setColorTranslucido(e.target.value)}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded text-xs font-bold"
                    >
                      <option value="Verde">Verde Esmeralda</option>
                      <option value="Azul">Azul Cielo</option>
                      <option value="Blanco">Blanco Opalino (Difusor Solar)</option>
                      <option value="Cristal">Cristal Transparente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Tipo de Plancha</label>
                    <select
                      value={tipoTranslucido}
                      onChange={(e) => setTipoTranslucido(e.target.value)}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded text-xs font-bold"
                    >
                      <option value="policarbonato_alveolar">Policarbonato Alveolar 6mm</option>
                      <option value="policarbonato_ondulado">Policarbonato Ondulado TR4</option>
                      <option value="fibra_vidrio">Fibra de Vidrio Translúcida</option>
                      <option value="acrilico">Policarbonato Compacto 4mm</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">H. Lado Alto (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sectorHAlto}
                  onChange={(e) => setSectorHAlto(parseFloat(e.target.value) || 0)}
                  disabled={acopladoAlTecho}
                  className={`w-full p-1.5 border rounded text-xs font-bold ${
                    acopladoAlTecho ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">H. Lado Bajo (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sectorHBajo}
                  onChange={(e) => setSectorHBajo(parseFloat(e.target.value) || 0)}
                  disabled={acopladoAlTecho}
                  className={`w-full p-1.5 border rounded text-xs font-bold ${
                    acopladoAlTecho ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Pendiente (%)</label>
              <input
                type="number"
                step="0.5"
                value={sectorSlope}
                onChange={(e) => setSectorSlope(parseFloat(e.target.value) || 0)}
                disabled={acopladoAlTecho}
                className={`w-full p-1.5 border rounded text-xs font-bold ${
                  acopladoAlTecho ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Dirección de Caída</label>
              <select
                value={sectorDir}
                onChange={(e) => {
                  const newDir = e.target.value as DireccionCaida;
                  setSectorDir(newDir);
                  if (type === 'sector' && onUpdateItem) {
                    const transColor = colorTranslucido === 'Azul' ? '#0284c7' : colorTranslucido === 'Blanco' ? '#94a3b8' : colorTranslucido === 'Cristal' ? '#06b6d4' : '#10b981';
                    const updated = {
                      ...item,
                      nombre: tag,
                      pendientePct: sectorSlope,
                      direccionCaida: newDir,
                      alturaLadoAlto: sectorHAlto,
                      alturaLadoBajo: sectorHBajo,
                      acopladoAlTecho,
                      esTranslucido,
                      colorTranslucido: esTranslucido ? colorTranslucido : undefined,
                      tipoTranslucido: esTranslucido ? tipoTranslucido : undefined,
                      color: esTranslucido ? transColor : (item.color || '#2563eb'),
                    };
                    onUpdateItem(updated, 'sector');
                  }
                }}
                disabled={acopladoAlTecho}
                className={`w-full p-1.5 border rounded text-xs font-bold ${
                  acopladoAlTecho ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="calle">Hacia la Calle (Frontal ↓)</option>
                <option value="interior">Hacia el Fondo / Interior (↑)</option>
                <option value="izquierda">Hacia la Izquierda (←)</option>
                <option value="derecha">Hacia la Derecha (→)</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* Footer Action Buttons */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
        {notice && (
          <p className="text-center text-[11px] font-bold text-emerald-600 animate-fade-in">
            {notice}
          </p>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar</span>
          </button>

          {onDuplicateItem && (
            <button
              onClick={() => onDuplicateItem(item, type)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold p-2 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
              title="Duplicar elemento"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              onDeleteItem(item.id, type);
              onClose();
            }}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold p-2 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
            title="Eliminar elemento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
