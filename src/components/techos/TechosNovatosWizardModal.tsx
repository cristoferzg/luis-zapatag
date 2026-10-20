// Asistente Paramétrico Inteligente de Techos Metálicos para Principiantes
// Permite ingresar medidas reales exactas (Luz, Largo, Altura de Columnas, Flechas, Pendientes)
// con total libertad de edición y sin bloqueos al borrar números
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  Lightbulb, 
  ShieldCheck, 
  Ruler,
  Save
} from 'lucide-react';
import { UseTechosCadEngineReturn, OrientacionTijeral } from './useTechosCadEngineState';
import { VistaTechoCAD } from './techosCadEngineTypes';
import { TipoTijeral, CATALOGO_TIJERALES_INFO } from './techosCadColors';
import { safeStorage } from '../../lib/storageManager';

interface TechosNovatosWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineState: UseTechosCadEngineReturn;
  onChangeVista?: (vista: VistaTechoCAD) => void;
  projectId?: string;
  projectName?: string;
}

export type TipoTechoWizard = 
  | 'parabolico' 
  | 'dos_aguas' 
  | 'una_agua' 
  | 'dientes_sierra' 
  | 'cuatro_aguas' 
  | 'seis_aguas' 
  | 'mansarda' 
  | 'cupula_domo' 
  | 'forma_l' 
  | 'mariposa' 
  | 'curvo_autoportante'
  | 'monitor'
  | 'mezzanine';

export const TechosNovatosWizardModal: React.FC<TechosNovatosWizardModalProps> = ({
  isOpen,
  onClose,
  engineState,
  onChangeVista,
  projectId,
  projectName: _projectName
}) => {
  const [tipo, setTipo] = useState<TipoTechoWizard>('parabolico');
  const [tipoTijeral, setTipoTijeral] = useState<TipoTijeral>('parabolico_warren');
  const [orientacionTijeral, setOrientacionTijeral] = useState<OrientacionTijeral>('transversal');
  
  // Estados numéricos almacenados como Strings para permitir al usuario borrar completamente sin bloqueos
  const [luzStr, setLuzStr] = useState<string>('12');
  const [largoStr, setLargoStr] = useState<string>('24');
  const [alturaColStr, setAlturaColStr] = useState<string>('4.5');
  const [flechaStr, setFlechaStr] = useState<string>('2.0');
  const [pendienteStr, setPendienteStr] = useState<string>('20');
  const [alturaCol2Str, setAlturaCol2Str] = useState<string>('6.0');
  const [numTijeralesStr, setNumTijeralesStr] = useState<string>('5');

  // Estados específicos para Dientes de Sierra y Cuatro Aguas
  const [numDientesStr, setNumDientesStr] = useState<string>('3');
  const [alturaDienteStr, setAlturaDienteStr] = useState<string>('1.8');
  const alturaCumbreraHipStr = '2.0';

  // Estados específicos para 6 Aguas, Mansarda, Domo, Forma en L y Mariposa
  const numAnillos6AgStr = '4';
  const alturaCuspide6AgStr = '2.2';
  const [alturaQuiebreManStr, setAlturaQuiebreManStr] = useState<string>('2.0');
  const [alturaCumbreraManStr, setAlturaCumbreraManStr] = useState<string>('1.2');
  const [diametroDomoStr, setDiametroDomoStr] = useState<string>('16');
  const [flechaDomoStr, setFlechaDomoStr] = useState<string>('2.5');
  const [costillasDomoStr, setCostillasDomoStr] = useState<string>('8');
  const [domoAnillosStr, setDomoAnillosStr] = useState<string>('4');
  const [domoConLinterna, setDomoConLinterna] = useState<boolean>(true);
  const [luzAlaLStr, setLuzAlaLStr] = useState<string>('8');
  const [largoAlaLStr, setLargoAlaLStr] = useState<string>('10');
  const [desnivelAlasStr, setDesnivelAlasStr] = useState<string>('1.5');

  // Estados específicos para Curvo Autoportante y Monitor de Ventilación
  const [flechaAutoStr, setFlechaAutoStr] = useState<string>('2.5');
  const [alturaMuroAutoStr, setAlturaMuroAutoStr] = useState<string>('3.5');
  const [numEjesAutoStr, setNumEjesAutoStr] = useState<string>('9');
  const [anchoMonitorStr, setAnchoMonitorStr] = useState<string>('3.0');
  const [alturaMonitorStr, setAlturaMonitorStr] = useState<string>('1.2');

  // Estados para modulación y espaciado de tijerales / montantes
  const [trussSpacingMode, setTrussSpacingMode] = useState<'divisiones' | 'espaciado'>('divisiones');
  const [trussDivisions, setTrussDivisions] = useState<number>(6);
  const [trussSpacingM, setTrussSpacingM] = useState<number>(0.60);
  const [trussHeightM, setTrussHeightM] = useState<number>(0.50);

  // Estados específicos para personalización de Mezzanine
  const [tipoTijeralPerimetral, setTipoTijeralPerimetral] = useState<TipoTijeral>('warren');
  const [customMontanteSpacing, setCustomMontanteSpacing] = useState<string>('');
  const [perimetralBracingEnabled, setPerimetralBracingEnabled] = useState<boolean>(false);
  const [mezzanineHueco, setMezzanineHueco] = useState<boolean>(false);
  const [mezzanineTijeralesPerimetro, setMezzanineTijeralesPerimetro] = useState<boolean>(false);
  const [mezzanineTijeralesInternos, setMezzanineTijeralesInternos] = useState<boolean>(false);

  // Estados para guardado por proyecto
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Cargar proyectos disponibles al montar
  useEffect(() => {
    const rawProjects = safeStorage.getItem<any[]>('sync_cache_projects_admin', []) ||
                        safeStorage.getItem<any[]>('sync_cache_projects_shared', []) || [];
    if (Array.isArray(rawProjects) && rawProjects.length > 0) {
      const pList = rawProjects.map(p => ({ id: p.id, name: p.nombre || p.name || `Proyecto #${p.id}` }));
      setProjectList(pList);
      if (!selectedProjectId && pList.length > 0) {
        setSelectedProjectId(pList[0].id);
      }
    }
  }, []);

  // Auto-guardar configuración actual en sessionStorage cuando hay cambios
  useEffect(() => {
    if (!isOpen) return;
    setHasUnsavedChanges(true);

    const autoSaveConfig = {
      tipo, tipoTijeral, orientacionTijeral, luzStr, largoStr, alturaColStr,
      flechaStr, pendienteStr, alturaCol2Str, numTijeralesStr, numDientesStr,
      alturaDienteStr, alturaQuiebreManStr, alturaCumbreraManStr, diametroDomoStr,
      flechaDomoStr, costillasDomoStr, domoAnillosStr, domoConLinterna,
      luzAlaLStr, largoAlaLStr, desnivelAlasStr, flechaAutoStr, alturaMuroAutoStr,
      numEjesAutoStr, anchoMonitorStr, alturaMonitorStr, trussSpacingMode,
      trussDivisions, trussSpacingM, trussHeightM, customMontanteSpacing,
      tipoTijeralPerimetral, perimetralBracingEnabled, mezzanineHueco,
      mezzanineTijeralesPerimetro, mezzanineTijeralesInternos,
      savedAt: new Date().toISOString()
    };
    sessionStorage.setItem('techosWizardSessionConfig', JSON.stringify(autoSaveConfig));
  }, [isOpen, tipo, tipoTijeral, orientacionTijeral, luzStr, largoStr, alturaColStr,
      flechaStr, pendienteStr, alturaCol2Str, numTijeralesStr, numDientesStr,
      alturaDienteStr, alturaQuiebreManStr, alturaCumbreraManStr, diametroDomoStr,
      flechaDomoStr, costillasDomoStr, domoAnillosStr, domoConLinterna,
      luzAlaLStr, largoAlaLStr, desnivelAlasStr, flechaAutoStr, alturaMuroAutoStr,
      numEjesAutoStr, anchoMonitorStr, alturaMonitorStr, trussSpacingMode,
      trussDivisions, trussSpacingM, trussHeightM, customMontanteSpacing,
      tipoTijeralPerimetral, perimetralBracingEnabled, mezzanineHueco,
      mezzanineTijeralesPerimetro, mezzanineTijeralesInternos]);

  // Función para guardar configuración actual para el proyecto seleccionado
  const handleSaveProjectConfig = () => {
    const targetId = selectedProjectId || projectId || 'proyecto_general';
    const configToSave = {
      tipo,
      tipoTijeral,
      orientacionTijeral,
      luzStr,
      largoStr,
      alturaColStr,
      flechaStr,
      pendienteStr,
      alturaCol2Str,
      numTijeralesStr,
      // Domos
      diametroDomoStr,
      flechaDomoStr,
      costillasDomoStr,
      domoAnillosStr,
      domoConLinterna,
      // Monitores & Otros
      anchoMonitorStr,
      alturaMonitorStr,
      trussSpacingMode,
      trussDivisions,
      trussSpacingM,
      trussHeightM,
      // Mezzanine
      mezzanineHueco,
      mezzanineTijeralesPerimetro,
      mezzanineTijeralesInternos,
      // Personalización técnica
      tipoTijeralPerimetral,
      customMontanteSpacing,
      perimetralBracingEnabled,
      savedAt: new Date().toISOString()
    };

    safeStorage.setItem(`techos_wizard_config_${targetId}`, configToSave);
    setSaveStatusMsg('✓ ¡Configuración guardada exitosamente para este proyecto!');
    setTimeout(() => setSaveStatusMsg(''), 3000);
  };

  // Función para cargar configuración guardada de un proyecto
  const handleLoadProjectConfig = (targetId: string) => {
    if (!targetId) return;
    const saved = safeStorage.getItem<any>(`techos_wizard_config_${targetId}`, null);
    if (saved) {
      if (saved.tipo) setTipo(saved.tipo);
      if (saved.tipoTijeral) setTipoTijeral(saved.tipoTijeral);
      if (saved.orientacionTijeral) setOrientacionTijeral(saved.orientacionTijeral);
      if (saved.luzStr) setLuzStr(saved.luzStr);
      if (saved.largoStr) setLargoStr(saved.largoStr);
      if (saved.alturaColStr) setAlturaColStr(saved.alturaColStr);
      if (saved.flechaStr) setFlechaStr(saved.flechaStr);
      if (saved.pendienteStr) setPendienteStr(saved.pendienteStr);
      if (saved.alturaCol2Str) setAlturaCol2Str(saved.alturaCol2Str);
      if (saved.numTijeralesStr) setNumTijeralesStr(saved.numTijeralesStr);

      if (saved.diametroDomoStr) setDiametroDomoStr(saved.diametroDomoStr);
      if (saved.flechaDomoStr) setFlechaDomoStr(saved.flechaDomoStr);
      if (saved.costillasDomoStr) setCostillasDomoStr(saved.costillasDomoStr);
      if (saved.domoAnillosStr) setDomoAnillosStr(saved.domoAnillosStr);
      if (saved.domoConLinterna !== undefined) setDomoConLinterna(saved.domoConLinterna);

      if (saved.anchoMonitorStr) setAnchoMonitorStr(saved.anchoMonitorStr);
      if (saved.alturaMonitorStr) setAlturaMonitorStr(saved.alturaMonitorStr);

      if (saved.mezzanineHueco !== undefined) setMezzanineHueco(saved.mezzanineHueco);
      if (saved.mezzanineTijeralesPerimetro !== undefined) setMezzanineTijeralesPerimetro(saved.mezzanineTijeralesPerimetro);
      if (saved.mezzanineTijeralesInternos !== undefined) setMezzanineTijeralesInternos(saved.mezzanineTijeralesInternos);
      if (saved.tipoTijeralPerimetral) setTipoTijeralPerimetral(saved.tipoTijeralPerimetral);
      if (saved.customMontanteSpacing) setCustomMontanteSpacing(saved.customMontanteSpacing);
      if (saved.perimetralBracingEnabled !== undefined) setPerimetralBracingEnabled(saved.perimetralBracingEnabled);

      setSaveStatusMsg('✓ ¡Configuración cargada del proyecto!');
      setTimeout(() => setSaveStatusMsg(''), 3000);
    } else {
      setSaveStatusMsg('ℹ️ No hay configuración previa guardada para este proyecto.');
      setTimeout(() => setSaveStatusMsg(''), 3000);
    }
  };

  // Cargar automáticamente configuración guardada si existe al iniciar
  useEffect(() => {
    const targetId = projectId || selectedProjectId;
    if (targetId) {
      const saved = safeStorage.getItem<any>(`techos_wizard_config_${targetId}`, null);
      if (saved) {
        handleLoadProjectConfig(targetId);
      }
    }
  }, [projectId]);

  // Parseos numéricos seguros con valores por defecto
  const luzM = Math.max(1, parseFloat(luzStr) || 12);
  const largoM = Math.max(1, parseFloat(largoStr) || 24);
  const alturaColM = Math.max(0.5, parseFloat(alturaColStr) || 4.5);
  const flechaM = Math.max(0.2, parseFloat(flechaStr) || 2.0);
  const pendientePct = Math.max(1, parseFloat(pendienteStr) || 20);
  const alturaCol2M = Math.max(alturaColM + 0.2, parseFloat(alturaCol2Str) || 6.0);
  const numTijerales = Math.max(2, parseInt(numTijeralesStr) || 5);
  const numDientes = Math.max(1, parseInt(numDientesStr) || 3);
  const alturaDienteM = Math.max(0.5, parseFloat(alturaDienteStr) || 1.8);
  const alturaCumbreraHipM = Math.max(0.5, parseFloat(alturaCumbreraHipStr) || 2.0);

  const numAnillos6Ag = Math.max(2, Math.min(8, parseInt(numAnillos6AgStr) || 4));
  const alturaCuspide6AgM = Math.max(0.5, parseFloat(alturaCuspide6AgStr) || 2.2);
  const alturaQuiebreManM = Math.max(0.5, parseFloat(alturaQuiebreManStr) || 2.0);
  const alturaCumbreraManM = Math.max(0.5, parseFloat(alturaCumbreraManStr) || 1.2);
  const diametroDomoM = Math.max(3, parseFloat(diametroDomoStr) || 16);
  const flechaDomoM = Math.max(0.5, parseFloat(flechaDomoStr) || 2.5);
  const costillasDomo = Math.max(4, Math.min(16, parseInt(costillasDomoStr) || 8));
  const luzAlaLM = Math.max(2, parseFloat(luzAlaLStr) || 8);
  const largoAlaLM = Math.max(2, parseFloat(largoAlaLStr) || 10);
  const desnivelAlasM = Math.max(0.3, parseFloat(desnivelAlasStr) || 1.5);

  const flechaAutoM = Math.max(0.5, parseFloat(flechaAutoStr) || 2.5);
  const alturaMuroAutoM = Math.max(0.5, parseFloat(alturaMuroAutoStr) || 3.5);
  const numEjesAuto = Math.max(3, parseInt(numEjesAutoStr) || 9);
  const anchoMonitorM = Math.max(1.0, parseFloat(anchoMonitorStr) || 3.0);
  const alturaMonitorM = Math.max(0.4, parseFloat(alturaMonitorStr) || 1.2);

  // Cálculo de proporciones recomendadas para techos parabólicos
  const flechaOptima = Number((luzM * 0.14).toFixed(2));
  const flechaMinima = Number((luzM * 0.10).toFixed(2));
  const flechaMaxima = Number((luzM * 0.20).toFixed(2));

  // Ajustar flecha óptima por defecto al cambiar la luz si el usuario no ha puesto una personalizada
  useEffect(() => {
    if (tipo === 'parabolico' && !flechaStr) {
      setFlechaStr(flechaOptima.toString());
    }
  }, [luzM, tipo, flechaOptima, flechaStr]);

  // Actualizar tipo de tijeral al cambiar el tipo de techo
  useEffect(() => {
    if (tipo === 'parabolico') {
      setTipoTijeral('parabolico_warren');
    } else if (tipo === 'mezzanine') {
      setTipoTijeral('plano_viga');
    } else {
      setTipoTijeral('escalera_vierendeel');
    }
  }, [tipo]);

  // Recomendación Inteligente de Tijeral según Luz y Altura
  const getRecomendacionTijeral = (): { id: TipoTijeral; motivo: string; beneficio: string } => {
    if (tipo === 'parabolico') {
      if (alturaColM >= 6.5) {
        return {
          id: 'parabolico_bowstring',
          motivo: `Columnas de gran altura (${alturaColM.toFixed(1)}m): El tirante horizontal recto absorbe el empuje hacia afuera, protegiendo las columnas.`,
          beneficio: 'Evita momentos de flexión críticos en la base de columnas'
        };
      }
      if (luzM > 18) {
        return {
          id: 'parabolico_pratt',
          motivo: `Gran luz (${luzM.toFixed(1)}m): Montantes radiales y diagonales a tracción para óptimo control de flecha y soporte de luminarias.`,
          beneficio: 'Rigidez superior y deflexión mínima en luz amplia'
        };
      }
      return {
        id: 'parabolico_warren',
        motivo: `Luz estándar/intermedia (${luzM.toFixed(1)}m): Celosía continua en zig-zag con menor cantidad de soldadura y mínimo peso de acero.`,
        beneficio: '15% de ahorro en mano de obra y acero estructural'
      };
    } else if (tipo === 'dos_aguas') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Tijeral Tipo Escalera / Vierendeel (Montantes a 90° sin diagonales): Celosía limpia y modulada para paso expedito de ductos, iluminación y bandejas eléctricas.`,
        beneficio: 'Vanos diáfanos y montaje rápido con espaciamiento exacto'
      };
    } else if (tipo === 'dientes_sierra') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Módulos Shed repetitivos: Montantes verticales a 90° para acristalamiento frontal y captación continua de luz natural cenital.`,
        beneficio: 'Fachada frontal libre de diagonales para ventanería'
      };
    } else if (tipo === 'cuatro_aguas') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Estructura Piramidal / Cuatro Caídas: Limatesas diagonales con tijerales modulares de peralte uniforme.`,
        beneficio: 'Excelente simetría y drenaje pluvial perimetral'
      };
    } else if (tipo === 'seis_aguas') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Pabellón Hexagonal de 6 Caídas: Limatesas radiales convergentes a la cúspide con tirantes inferiores radiales.`,
        beneficio: 'Rigidez torsional simétrica ideal para quioscos y pérgolas industriales'
      };
    } else if (tipo === 'mansarda') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Perfil Quebrado Mansarda (Gambrel): Montantes a 90° en quiebre inferior para maximizar volumen interior y almacenamiento vertical.`,
        beneficio: '30% más de volumen útil bajo cubierta sin aumentar altura de alero'
      };
    } else if (tipo === 'cupula_domo') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Domo Geodésico Circular: Arcos radiales autoportantes apoyados en anillo de tracción perimetral.`,
        beneficio: 'Gran luz sin columnas intermedias con mínima superficie expuesta al viento'
      };
    } else if (tipo === 'forma_l') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Nave en Escuadra con Limahoya: Intersección ortogonal de dos alas con viga limahoya colectora de drenaje pluvial.`,
        beneficio: 'Aprovechamiento integral de lotes en esquina o patios perimetrales'
      };
    } else if (tipo === 'mariposa') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Techo Mariposa (V Invertida): Dos faldones invertidos con pendiente convergente hacia la canaleta central.`,
        beneficio: 'Captación centralizada de aguas pluviales e iluminación perimetral alta'
      };
    } else if (tipo === 'curvo_autoportante') {
      return {
        id: 'simple_arco',
        motivo: `Arco Catenario Continuo / Tipo Span: Secciones continuas sin cerchas intermedias, con tirante horizontal inferior en arranques.`,
        beneficio: 'Montaje 40% más rápido y vano totalmente libre sin interferencias'
      };
    } else if (tipo === 'monitor') {
      return {
        id: 'escalera_vierendeel',
        motivo: `Techo Industrial con Linterna Cenital (Monitor): Celosía modular con sobre-techo elevado para tiro térmico natural y persianas.`,
        beneficio: 'Evacuación de humos y calor por efecto chimenea sin consumo energético'
      };
    }
    return {
      id: 'escalera_vierendeel',
      motivo: 'Montantes a 90° para rápida fabricación y modulación precisa.',
      beneficio: 'Espaciamiento modular exacto'
    };
  };

  const recomendacion = getRecomendacionTijeral();

  if (!isOpen) return null;

  const handleAplicarFlechaOptima = () => {
    setFlechaStr(flechaOptima.toString());
  };

  const handleAplicarTijeralRecomendado = () => {
    setTipoTijeral(recomendacion.id);
  };

  const handleGenerarEstructura = () => {
    if (!engineState) return;

    const divisionsParam = trussSpacingMode === 'divisiones' ? trussDivisions : undefined;
    const spacingParam = trussSpacingMode === 'espaciado' ? (parseFloat(customMontanteSpacing) || trussSpacingM) : undefined;

    if (tipo === 'parabolico') {
      const peralteArco = trussHeightM || Math.max(0.50, Math.min(1.20, Number((luzM / 18).toFixed(2))));
      engineState.generateRoofParabolic(luzM, largoM, alturaColM, flechaM, tipoTijeral, peralteArco, orientacionTijeral, numTijerales, undefined, spacingParam, perimetralBracingEnabled, tipoTijeralPerimetral);
    } else if (tipo === 'dos_aguas') {
      engineState.generateRoofGable(luzM, largoM, alturaColM, pendientePct, tipoTijeral, orientacionTijeral, numTijerales, undefined, divisionsParam, spacingParam, trussHeightM, perimetralBracingEnabled, tipoTijeralPerimetral);
    } else if (tipo === 'una_agua') {
      engineState.generateRoofMonoslope(luzM, largoM, alturaColM, alturaCol2M, tipoTijeral, numTijerales, trussHeightM || 0.60, orientacionTijeral, undefined, spacingParam, perimetralBracingEnabled, tipoTijeralPerimetral);
    } else if (tipo === 'dientes_sierra') {
      engineState.generateRoofSawtooth(luzM, largoM, alturaColM, numDientes, alturaDienteM, tipoTijeral, numTijerales, divisionsParam, spacingParam, trussHeightM, orientacionTijeral);
    } else if (tipo === 'cuatro_aguas') {
      engineState.generateRoofHip(luzM, largoM, alturaColM, alturaCumbreraHipM, tipoTijeral, numTijerales, spacingParam, orientacionTijeral);
    } else if (tipo === 'seis_aguas') {
      engineState.generateRoof6Aguas(luzM, largoM, alturaColM, alturaCuspide6AgM, tipoTijeral, numAnillos6Ag, spacingParam, orientacionTijeral);
    } else if (tipo === 'mansarda') {
      engineState.generateRoofMansarda(luzM, largoM, alturaColM, alturaQuiebreManM, alturaCumbreraManM, tipoTijeral, numTijerales, spacingParam, orientacionTijeral);
    } else if (tipo === 'cupula_domo') {
      engineState.generateRoofDome(diametroDomoM, alturaColM, flechaDomoM, costillasDomo, tipoTijeral, spacingParam, orientacionTijeral);
    } else if (tipo === 'forma_l') {
      engineState.generateRoofLShaped(luzM, largoM, luzAlaLM, largoAlaLM, alturaColM, tipoTijeral, orientacionTijeral);
    } else if (tipo === 'mariposa') {
      engineState.generateRoofButterfly(luzM, largoM, alturaColM, desnivelAlasM, tipoTijeral, numTijerales, orientacionTijeral);
    } else if (tipo === 'curvo_autoportante') {
      engineState.generateRoofCurvoAutoportante(luzM, largoM, alturaMuroAutoM, flechaAutoM, numEjesAuto, tipoTijeral, orientacionTijeral);
    } else if (tipo === 'monitor') {
      engineState.generateRoofMonitor(luzM, largoM, alturaColM, pendientePct, anchoMonitorM, alturaMonitorM, tipoTijeral, numTijerales, orientacionTijeral);
    } else if (tipo === 'mezzanine') {
      engineState.generateMezzanine(
        largoM,
        luzM,
        alturaColM,
        trussDivisions || Math.max(2, Math.round(largoM / 4)),
        Math.max(2, Math.round(luzM / 3)),
        mezzanineHueco,
        mezzanineTijeralesPerimetro,
        mezzanineTijeralesInternos,
        tipoTijeral
      );
    }

    if (onChangeVista) {
      onChangeVista('seccion');
    }

    setHasUnsavedChanges(false);
    sessionStorage.removeItem('techosWizardSessionConfig');
    onClose();
  };

  const handleCloseWithConfirm = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        '⚠️ Tienes cambios sin guardar en la configuración del techo.\n\n¿Deseas descartar estos cambios y cerrar el asistente?'
      );
      if (!confirmed) return;
    }
    setHasUnsavedChanges(false);
    sessionStorage.removeItem('techosWizardSessionConfig');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABECERA */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-white tracking-wide">
                Asistente de Techos Paramétrico
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100 font-medium">
                Ingresa tus medidas exactas y genera la estructura 100% acoplada
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseWithConfirm}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
          
          {/* VINCULACIÓN DE PROYECTO (Compact, Responsive and Essential) */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50/90 to-orange-50/20 rounded-2xl border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">📁</span>
              <div className="min-w-0">
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                  <span>Vincular con Obra Activa</span>
                  {saveStatusMsg && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md animate-pulse">
                      {saveStatusMsg}
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-500 truncate">Guarda o carga el plano en este proyecto.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0 min-w-0">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  if (e.target.value) {
                    handleLoadProjectConfig(e.target.value);
                  }
                }}
                className="w-full sm:w-56 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-3xs cursor-pointer truncate"
              >
                <option value="">-- Seleccionar obra --</option>
                {projectList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSaveProjectConfig}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-3xs shrink-0 active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Plano</span>
              </button>
            </div>
          </div>

          {/* PASO 1: SELECCIONAR TIPO DE TECHO */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">1</span>
              Selecciona el Tipo de Estructura
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {/* PARABÓLICO */}
              <button
                type="button"
                onClick={() => setTipo('parabolico')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'parabolico'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏟️</div>
                <div className="text-xs font-bold leading-tight">Parabólico Rolado</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Arco curvo con celosía</div>
              </button>

              {/* DOS AGUAS */}
              <button
                type="button"
                onClick={() => setTipo('dos_aguas')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'dos_aguas'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏠</div>
                <div className="text-xs font-bold leading-tight">A Dos Aguas</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tijeral cumbrera central</div>
              </button>

              {/* UNA AGUA */}
              <button
                type="button"
                onClick={() => setTipo('una_agua')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'una_agua'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">📐</div>
                <div className="text-xs font-bold leading-tight">A Una Agua</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Inclinado monopendiente</div>
              </button>

              {/* DIENTES DE SIERRA */}
              <button
                type="button"
                onClick={() => setTipo('dientes_sierra')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'dientes_sierra'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏭</div>
                <div className="text-xs font-bold leading-tight">Dientes de Sierra</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sheds luz cenital natural</div>
              </button>

              {/* MANSARDA */}
              <button
                type="button"
                onClick={() => setTipo('mansarda')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'mansarda'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏚️</div>
                <div className="text-xs font-bold leading-tight">Mansarda (Gambrel)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Perfil quebrado doble pendiente</div>
              </button>

              {/* EN FORMA DE L */}
              <button
                type="button"
                onClick={() => setTipo('forma_l')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'forma_l'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">📐</div>
                <div className="text-xs font-bold leading-tight">En Forma de L</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Nave en escuadra con limahoya</div>
              </button>

              {/* MARIPOSA */}
              <button
                type="button"
                onClick={() => setTipo('mariposa')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'mariposa'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🦋</div>
                <div className="text-xs font-bold leading-tight">Techo Mariposa</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Caídas a canaleta central en V</div>
              </button>

              {/* CURVO AUTOPORTANTE / TIPO SPAN */}
              <button
                type="button"
                onClick={() => setTipo('curvo_autoportante')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'curvo_autoportante'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🌈</div>
                <div className="text-xs font-bold leading-tight">Curvo Autoportante</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Arcotecho continuo sin vigas</div>
              </button>

              {/* CON LINTERNA / MONITOR INDUSTRIAL */}
              <button
                type="button"
                onClick={() => setTipo('monitor')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'monitor'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏭</div>
                <div className="text-xs font-bold leading-tight">Linterna / Monitor</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ventilación cenital industrial</div>
              </button>

              {/* MEZZANINE */}
              <button
                type="button"
                onClick={() => setTipo('mezzanine')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                  tipo === 'mezzanine'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">🏢</div>
                <div className="text-xs font-bold leading-tight">Mezzanine Plano</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Piso/Entrepiso de vigas</div>
              </button>
            </div>
          </div>

          {/* PASO 2: MEDIDAS EXACTAS EDITABLES (SIN BLOQUEOS AL BORRAR) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                Ingresa las Medidas Reales
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Edición de texto libre
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
              
              {/* LUZ LIBRE (ANCHO FRONTAL) */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Luz / Ancho Frontal (L):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={luzStr}
                      onChange={(e) => setLuzStr(e.target.value)}
                      className="w-20 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-right font-mono font-black text-amber-900 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                      placeholder="12.0"
                    />
                    <span className="text-xs font-bold text-slate-500">m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="4"
                  max="40"
                  step="0.5"
                  value={luzM || 12}
                  onChange={(e) => setLuzStr(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer h-1.5"
                />
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[8, 10, 12, 15, 18, 24].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLuzStr(val.toString())}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              {/* LARGO / FONDO DE LA NAVE */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Largo / Fondo (Z):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={largoStr}
                      onChange={(e) => setLargoStr(e.target.value)}
                      className="w-20 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-right font-mono font-black text-amber-900 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                      placeholder="24.0"
                    />
                    <span className="text-xs font-bold text-slate-500">m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="6"
                  max="80"
                  step="1"
                  value={largoM || 24}
                  onChange={(e) => setLargoStr(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer h-1.5"
                />
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[12, 18, 24, 30, 36, 48].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLargoStr(val.toString())}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              {/* ALTURA DE COLUMNAS */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Altura de Columnas (H):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={alturaColStr}
                      onChange={(e) => setAlturaColStr(e.target.value)}
                      className="w-20 bg-blue-50 border border-blue-300 rounded-lg px-2 py-1 text-right font-mono font-black text-blue-900 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="4.5"
                    />
                    <span className="text-xs font-bold text-slate-500">m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2.5"
                  max="14"
                  step="0.25"
                  value={alturaColM || 4.5}
                  onChange={(e) => setAlturaColStr(e.target.value)}
                  className="w-full accent-blue-600 cursor-pointer h-1.5"
                />
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[3.0, 3.5, 4.0, 4.5, 5.0, 6.0].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAlturaColStr(val.toString())}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              {/* FLECHA O PENDIENTE SEGÚN TIPO */}
              {tipo === 'parabolico' && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Flecha del Arco (F):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={flechaStr}
                        onChange={(e) => setFlechaStr(e.target.value)}
                        className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                        placeholder="2.0"
                      />
                      <span className="text-xs font-bold text-slate-500">m</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={flechaM || 2.0}
                    onChange={(e) => setFlechaStr(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5"
                  />
                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <button
                      type="button"
                      onClick={handleAplicarFlechaOptima}
                      className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 font-bold transition-colors cursor-pointer"
                    >
                      ✨ Aplicar Flecha Óptima ({flechaOptima}m)
                    </button>
                    <span className="text-slate-400 font-mono font-medium">
                      {flechaMinima}m - {flechaMaxima}m
                    </span>
                  </div>
                </div>
              )}

              {tipo === 'dos_aguas' && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Pendiente Cumbrera (%):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pendienteStr}
                        onChange={(e) => setPendienteStr(e.target.value)}
                        className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                        placeholder="20"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="50"
                    step="1"
                    value={pendientePct || 20}
                    onChange={(e) => setPendienteStr(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5"
                  />
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[12, 15, 20, 25, 30].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPendienteStr(val.toString())}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-mono text-[10px] font-bold cursor-pointer"
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tipo === 'una_agua' && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Altura Columna Alta:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={alturaCol2Str}
                        onChange={(e) => setAlturaCol2Str(e.target.value)}
                        className="w-20 bg-blue-50 border border-blue-300 rounded-lg px-2 py-1 text-right font-mono font-black text-blue-900 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder="6.0"
                      />
                      <span className="text-xs font-bold text-slate-500">m</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="16.0"
                    step="0.5"
                    value={alturaCol2M || 6.0}
                    onChange={(e) => setAlturaCol2Str(e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer h-1.5"
                  />
                  <div className="text-[10px] text-slate-500 font-mono">
                    Desnivel: +{(alturaCol2M - alturaColM).toFixed(2)}m respecto a la columna baja.
                  </div>
                </div>
              )}

              {/* OPCIONES ESPECÍFICAS PARA DIENTES DE SIERRA */}
              {tipo === 'dientes_sierra' && (
                <>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">N° de Dientes / Sheds:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={numDientesStr}
                          onChange={(e) => setNumDientesStr(e.target.value)}
                          className="w-20 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-right font-mono font-black text-amber-900 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                          placeholder="3"
                        />
                        <span className="text-xs font-bold text-slate-500">sheds</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {[2, 3, 4, 5, 6].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNumDientesStr(val.toString())}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            numDientes === val ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
                          }`}
                        >
                          {val} Dientes
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ancho de cada diente: {(luzM / numDientes).toFixed(2)}m
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Altura Ventana Shed (H):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alturaDienteStr}
                          onChange={(e) => setAlturaDienteStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="1.8"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="4.0"
                      step="0.1"
                      value={alturaDienteM || 1.8}
                      onChange={(e) => setAlturaDienteStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {[1.2, 1.5, 1.8, 2.0, 2.5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAlturaDienteStr(val.toString())}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-mono text-[10px] font-bold cursor-pointer"
                        >
                          {val}m
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* OPCIONES ESPECÍFICAS PARA MANSARDA */}
              {tipo === 'mansarda' && (
                <>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Altura Quiebre Inferior:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alturaQuiebreManStr}
                          onChange={(e) => setAlturaQuiebreManStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="2.0"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="4.0"
                      step="0.1"
                      value={alturaQuiebreManM || 2.0}
                      onChange={(e) => setAlturaQuiebreManStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Altura Cumbrera Superior:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alturaCumbreraManStr}
                          onChange={(e) => setAlturaCumbreraManStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="1.2"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="3.0"
                      step="0.1"
                      value={alturaCumbreraManM || 1.2}
                      onChange={(e) => setAlturaCumbreraManStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                  </div>
                </>
              )}

              {/* OPCIONES ESPECÍFICAS PARA EN FORMA DE L */}
              {tipo === 'forma_l' && (
                <>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Luz Ala Lateral:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={luzAlaLStr}
                          onChange={(e) => setLuzAlaLStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="8.0"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Largo Ala Lateral:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={largoAlaLStr}
                          onChange={(e) => setLargoAlaLStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="10.0"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* OPCIONES ESPECÍFICAS PARA MARIPOSA */}
              {tipo === 'mariposa' && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Desnivel Alas hacia Canaleta Central (V):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={desnivelAlasStr}
                        onChange={(e) => setDesnivelAlasStr(e.target.value)}
                        className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                        placeholder="1.5"
                      />
                      <span className="text-xs font-bold text-slate-500">m</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.1"
                    value={desnivelAlasM || 1.5}
                    onChange={(e) => setDesnivelAlasStr(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5"
                  />
                </div>
              )}



              {/* OPCIONES ESPECÍFICAS PARA CURVO AUTOPORTANTE */}
              {tipo === 'curvo_autoportante' && (
                <>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Flecha del Arco (F):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={flechaAutoStr}
                          onChange={(e) => setFlechaAutoStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="2.5"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                      value={flechaAutoM || 2.5}
                      onChange={(e) => setFlechaAutoStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                    <div className="text-[10px] text-slate-500 font-mono">
                      Relación F/L: {((flechaAutoM / luzM) * 100).toFixed(1)}% (Óptimo: 15% - 22%)
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Altura de Muro / Pedestal:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alturaMuroAutoStr}
                          onChange={(e) => setAlturaMuroAutoStr(e.target.value)}
                          className="w-20 bg-blue-50 border border-blue-300 rounded-lg px-2 py-1 text-right font-mono font-black text-blue-900 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
                          placeholder="3.5"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.25"
                      value={alturaMuroAutoM || 3.5}
                      onChange={(e) => setAlturaMuroAutoStr(e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Cantidad de Arcos / Ejes:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={3}
                          max={30}
                          value={numEjesAutoStr}
                          onChange={(e) => setNumEjesAutoStr(e.target.value)}
                          className="w-20 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-right font-mono font-black text-amber-900 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                          placeholder="9"
                        />
                        <span className="text-xs font-bold text-slate-500">arcos</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {[5, 7, 9, 11, 13, 15].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNumEjesAutoStr(val.toString())}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            numEjesAuto === val ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'
                          }`}
                        >
                          {val} Arcos
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* OPCIONES ESPECÍFICAS PARA MONITOR / LINTERNA CENITAL */}
              {tipo === 'monitor' && (
                <>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Ancho Linterna Monitor:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={anchoMonitorStr}
                          onChange={(e) => setAnchoMonitorStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="3.0"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max={Math.min(8.0, luzM * 0.5)}
                      step="0.2"
                      value={anchoMonitorM || 3.0}
                      onChange={(e) => setAnchoMonitorStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Altura Abertura Ventilación:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alturaMonitorStr}
                          onChange={(e) => setAlturaMonitorStr(e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 text-right font-mono font-black text-emerald-900 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                          placeholder="1.2"
                        />
                        <span className="text-xs font-bold text-slate-500">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.5"
                      step="0.1"
                      value={alturaMonitorM || 1.2}
                      onChange={(e) => setAlturaMonitorStr(e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                  </div>
                </>
              )}

              {/* CANTIDAD DE TIJERALES / PÓRTICOS */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Cantidad de Tijerales / Ejes (Pórticos):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={numTijeralesStr}
                      onChange={(e) => setNumTijeralesStr(e.target.value)}
                      className="w-20 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-right font-mono font-black text-amber-900 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                      placeholder="5"
                    />
                    <span className="text-xs font-bold text-slate-500">unids</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[3, 4, 5, 6, 7, 8, 10, 12].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNumTijeralesStr(val.toString())}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                        numTijerales === val ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
                      }`}
                    >
                      {val} Tijerales
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-400 ml-auto">
                    Separación: {numTijerales > 1 ? (largoM / (numTijerales - 1)).toFixed(2) : 0}m e/e
                  </span>
                </div>
              </div>

              {/* OPCIONES ESPECIALES DE MEZZANINE */}
              {tipo === 'mezzanine' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl sm:col-span-2 space-y-3">
                  <span className="block text-xs font-black text-amber-950 uppercase tracking-wide">
                    Opciones Especiales de Mezzanine
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Mezzanine Hueco */}
                    <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={mezzanineHueco}
                        onChange={(e) => setMezzanineHueco(e.target.checked)}
                        className="mt-1 accent-amber-600 rounded"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Mezzanine Hueco</span>
                        <span className="text-[10px] text-slate-500">Interior vacío, solo vigas y columnas en el perímetro.</span>
                      </div>
                    </label>

                    {/* Tijerales Perímetro */}
                    <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={mezzanineTijeralesPerimetro}
                        onChange={(e) => setMezzanineTijeralesPerimetro(e.target.checked)}
                        className="mt-1 accent-amber-600 rounded"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Tijerales de Borde</span>
                        <span className="text-[10px] text-slate-500">Refuerzo estructural de tijerales en los costados/perímetro.</span>
                      </div>
                    </label>

                    {/* Tijerales Internos */}
                    <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={mezzanineTijeralesInternos}
                        onChange={(e) => setMezzanineTijeralesInternos(e.target.checked)}
                        className="mt-1 accent-amber-600 rounded"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Tijerales Internos</span>
                        <span className="text-[10px] text-slate-500">Refuerzo de tijerales dentro del entrepiso.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* PASO 3: SELECCIONAR TIPO DE TIJERAL Y RECOMENDACIÓN DE INGENIERÍA */}
          {true && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">3</span>
                  Selecciona la Tipología del Tijeral
                </label>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold border border-amber-300 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  Asistente Estructural
                </span>
              </div>

              {/* TARJETA DE RECOMENDACIÓN INTELIGENTE */}
              <div className="mb-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-2xl p-3 shadow-2xs">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-500 text-white shrink-0 mt-0.5 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-blue-950">
                          Recomendación para Luz de {luzM.toFixed(1)}m:
                        </span>
                        <span className="text-[11px] font-black text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-lg border border-blue-200">
                          {CATALOGO_TIJERALES_INFO[recomendacion.id]?.nombre || recomendacion.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5 leading-snug">
                        {recomendacion.motivo}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ventaja de Obra: {recomendacion.beneficio}</span>
                      </p>
                    </div>
                  </div>

                  {tipoTijeral !== recomendacion.id ? (
                    <button
                      type="button"
                      onClick={handleAplicarTijeralRecomendado}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black shrink-0 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aplicar</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-xl shrink-0">
                      ✓ Activo
                    </span>
                  )}
                </div>
              </div>

              {/* OPCIONES DE TIJERALES SEGÚN TIPO DE TECHO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* CONFIGURACIÓN AVANZADA DE TIJERALES (MIXTO) */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                    Configuración Avanzada (Mixto / Perimetral)
                  </span>
                  
                  <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">Refuerzos Laterales (Arriostramiento)</span>
                    <input
                      type="checkbox"
                      checked={perimetralBracingEnabled}
                      onChange={(e) => setPerimetralBracingEnabled(e.target.checked)}
                      className="accent-emerald-600 h-4 w-4"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Tipo de Tijeral Perimetral (si es diferente):</span>
                    <select
                      value={tipoTijeralPerimetral}
                      onChange={(e) => setTipoTijeralPerimetral(e.target.value as TipoTijeral)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="warren">Warren (Estándar)</option>
                      <option value="pratt">Pratt</option>
                      <option value="fink">Fink</option>
                      <option value="escalera_vierendeel">Escalera (Vierendeel)</option>
                    </select>
                  </div>
                </div>

                {tipo === 'parabolico' && (
                  <>
                    {/* PARABÓLICO WARREN */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('parabolico_warren')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'parabolico_warren'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Parabólico Warren (Zig-Zag)</span>
                          {recomendacion.id === 'parabolico_warren' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Óptimo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Arco continuo con celosía en V/W. Menor peso de acero y rápida soldadura.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-amber-700 mt-2 font-mono">
                        Peralte estructural: {(luzM / 18).toFixed(2)}m
                      </div>
                    </button>

                    {/* PARABÓLICO PRATT */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('parabolico_pratt')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'parabolico_pratt'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Parabólico Pratt (Montantes)</span>
                          {recomendacion.id === 'parabolico_pratt' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Óptimo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes radiales verticales + diagonales a tracción. Gran rigidez para colgar ductos y luminarias.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-purple-700 mt-2 font-mono">
                        Máximo control de flecha
                      </div>
                    </button>

                    {/* PARABÓLICO BOWSTRING */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('parabolico_bowstring')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'parabolico_bowstring'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Arco Atirantado (Bowstring)</span>
                          {recomendacion.id === 'parabolico_bowstring' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Óptimo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Tirante horizontal recto que conecta las cabezas de columna. Anula el empuje lateral hacia afuera.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-sky-700 mt-2 font-mono">
                        Ideal en columnas esbeltas
                      </div>
                    </button>

                    {/* SIMPLE ARCO */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('simple_arco')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'simple_arco'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Arco Rolado Monotubo</span>
                          {luzM <= 8 && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Liviano</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Tubo curvado simple sin celosía interna. Recomendado solo para luces cortas de cocheras y terrazas (≤8m).
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 mt-2 font-mono">
                        Para techos livianos
                      </div>
                    </button>
                  </>
                )}

                {tipo === 'dos_aguas' && (
                  <>
                    {/* TIJERAL ESCALERA / VIERENDEEL */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('escalera_vierendeel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'escalera_vierendeel'
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900">🪜 Tipo Escalera (Vierendeel)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Vanos Limpios</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Cordones paralelos con montantes rectos a 90° sin diagonales. Paso libre para ductos e iluminación.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Espacios modulares regulares
                      </div>
                    </button>

                    {/* FINK */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('fink')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'fink'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Tijeral Fink (En W Simétrica)</span>
                          {recomendacion.id === 'fink' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Óptimo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          El más económico y tradicional en naves industriales a 2 aguas de 6m a 24m.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Ahorro del 20% en acero
                      </div>
                    </button>

                    {/* PRATT */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('pratt')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'pratt'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Tijeral Pratt (A Tracción)</span>
                          {recomendacion.id === 'pratt' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Óptimo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Diagonales orientadas hacia la cumbrera. Trabajan a tracción evitando el pandeo lateral.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-700 mt-2 font-mono">
                        Para grandes cargas
                      </div>
                    </button>

                    {/* HOWE */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('howe')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'howe'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Howe (A Apoyos)</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Diagonales orientadas hacia los apoyos. Ideal para cargas concentradas en nudos superiores.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-rose-700 mt-2 font-mono">
                        Estructuras pesadas
                      </div>
                    </button>

                    {/* WARREN */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('warren')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'warren'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Warren (Triángulos)</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Triangulación continua sin montantes. Montaje y armado rápido en taller.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-cyan-700 mt-2 font-mono">
                        Fabricación rápida
                      </div>
                    </button>
                  </>
                )}

                {tipo === 'una_agua' && (
                  <>
                    {/* TIJERAL ESCALERA UNA AGUA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('escalera_vierendeel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'escalera_vierendeel'
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900">🪜 Tipo Escalera (Vierendeel)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Vanos Limpios</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes rectos a 90° perpendiculares sin cruces diagonales. Espacios diáfanos y estéticos.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Espacios modulares regulares
                      </div>
                    </button>

                    {/* PRATT UNA AGUA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('pratt')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'pratt'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Tijeral Pratt Un Agua</span>
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">Recomendado</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes verticales y diagonales ascendentes a tracción. Excelente capacidad portante.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-700 mt-2 font-mono">
                        Ideal para techos inclinados
                      </div>
                    </button>

                    {/* WARREN UNA AGUA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('warren')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'warren'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Warren Un Agua</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Zig-zag continuo de celosía triangular en V. Menor cantidad de uniones soldadas.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-cyan-700 mt-2 font-mono">
                        Menor peso y corte rápido
                      </div>
                    </button>

                    {/* HOWE UNA AGUA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('howe')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'howe'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Howe Un Agua</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Diagonales orientadas hacia la columna baja a compresión. Gran resistencia a sobrecargas.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-rose-700 mt-2 font-mono">
                        Resistencia a nieve y granizo
                      </div>
                    </button>
                  </>
                )}

                {tipo === 'dientes_sierra' && (
                  <>
                    {/* TIJERAL ESCALERA DIENTES DE SIERRA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('escalera_vierendeel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'escalera_vierendeel'
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900">🪜 Tipo Escalera (Vierendeel)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Recomendado</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes verticales a 90° perpendiculares sin cruces diagonales. Ideal para ventanales de captación cenital.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Vanos diáfanos para vidrio o policarbonato
                      </div>
                    </button>

                    {/* WARREN DIENTES DE SIERRA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('warren')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'warren'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Warren</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Triangulación continua en zig-zag. Gran rigidez con mínimo peso estructural de acero.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-cyan-700 mt-2 font-mono">
                        Armado y soldado rápido
                      </div>
                    </button>

                    {/* PRATT DIENTES DE SIERRA */}
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('pratt')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'pratt'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Tijeral Pratt</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes verticales y diagonales a tracción hacia el vértice del diente.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-700 mt-2 font-mono">
                        Alta capacidad portante
                      </div>
                    </button>
                  </>
                )}

                {/* TIJERAS COMPATIBLES CON TODOS LOS ESTILOS */}
                <>
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('escalera_vierendeel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'escalera_vierendeel'
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900">🪜 Celosía Escalera (90°)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Universal</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Montantes a 90° con espaciado constante y cordones paralelos. Diseño limpio y rígido.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Espacios modulares limpios
                      </div>
                    </button>
                </>

                {(tipo === 'mansarda' || tipo === 'forma_l' || tipo === 'mariposa' || tipo === 'mezzanine') && (
                  <>
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('fink')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'fink'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Triangulación Fink</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Diagonales en W que reducen la flexión de los cordones superiores e inferiores.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-2 font-mono">
                        Máximo ahorro en perfiles
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoTijeral('pratt')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'pratt'
                          ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Triangulación Pratt</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Diagonales trabajando a tracción pura para resistir vientos fuertes y sobrecargas de nieve/lluvia.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-700 mt-2 font-mono">
                        Rigidez estructural extrema
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoTijeral('warren')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        tipoTijeral === 'warren'
                          ? 'border-cyan-500 bg-cyan-50/90 text-cyan-950 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black">Triangulación Warren (V/W)</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          Triángulos continuos en zig-zag. Gran rapidez de soldadura y distribución equilibrada de cargas.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-cyan-700 mt-2 font-mono">
                        Ligereza y alta resistencia
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* SELECTOR DE DISPOSICIÓN Y ORIENTACIÓN DEL TIJERAL (Transversal, Longitudinal, Perimetral, Completo) */}
              <div className="mt-3 pt-3 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>🌐</span> Disposición y Orientación Estructural:
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                    {orientacionTijeral}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOrientacionTijeral('transversal')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      orientacionTijeral === 'transversal' || orientacionTijeral === 'vertical'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-[11px]'
                    }`}
                  >
                    <span className="text-[11px] font-black">Transversal</span>
                    <span className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Pórticos principales en cada eje</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientacionTijeral('longitudinal')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      orientacionTijeral === 'longitudinal' || orientacionTijeral === 'horizontal'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20 shadow-2xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-[11px]'
                    }`}
                  >
                    <span className="text-[11px] font-black">Longitudinal</span>
                    <span className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Celosías en cumbrera y aleros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientacionTijeral('perimetral')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      orientacionTijeral === 'perimetral'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-[11px]'
                    }`}
                  >
                    <span className="text-[11px] font-black">Perimetral</span>
                    <span className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Tímpanos en fachadas y testeros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientacionTijeral('completo')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      orientacionTijeral === 'completo' || orientacionTijeral === 'ambos'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-[11px]'
                    }`}
                  >
                    <span className="text-[11px] font-black">Completo 3D</span>
                    <span className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Transversal + Long. + Perímetro</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: CONFIGURACIÓN DE ESPACIOS Y MODULACIÓN ENTRE MONTANTES */}
          <div className="bg-slate-50/95 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">4</span>
                <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                Definir Espacios entre Montantes y Peralte
              </label>

              {/* Toggle Por N° de Espacios vs Por Distancia Fija */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-300 text-[10px] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTrussSpacingMode('divisiones')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    trussSpacingMode === 'divisiones'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por N° Espacios
                </button>
                <button
                  type="button"
                  onClick={() => setTrussSpacingMode('espaciado')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    trussSpacingMode === 'espaciado'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Distancia (m)
                </button>
              </div>
            </div>

            {/* INPUT DE ESPACIAMIENTO MANUAL */}
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-600">Separación Montantes (m):</label>
                <input
                  type="number"
                  value={customMontanteSpacing}
                  onChange={(e) => setCustomMontanteSpacing(e.target.value)}
                  placeholder="Ej: 1.50"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              
              {/* INDICADOR DE VALIDACIÓN SIMPLE */}
              {customMontanteSpacing && (
                <div className={`p-2 rounded-lg text-[9px] font-bold border ${parseFloat(customMontanteSpacing) > 2.0 ? 'bg-orange-100 text-orange-900 border-orange-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                   {parseFloat(customMontanteSpacing) > 2.0 ? '⚠️ Separación alta: Revisar rigidez' : '✅ Espaciamiento recomendado'}
                </div>
              )}
            </div>

            {/* Selector interactivo de espacios */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
              {trussSpacingMode === 'divisiones' ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-600 font-bold shrink-0">N° de Espacios:</span>
                  {[3, 4, 5, 6, 8, 10, 12, 16].map(div => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setTrussDivisions(div)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                        trussDivisions === div
                          ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {div} espacios
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={trussDivisions}
                      onChange={(e) => setTrussDivisions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-mono font-black text-slate-900 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-600 font-bold shrink-0">Distancia entre montantes:</span>
                  {[0.40, 0.50, 0.60, 0.75, 0.90, 1.00].map(sp => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setTrussSpacingM(sp)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                        trussSpacingM === sp
                          ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      c/{sp.toFixed(2)}m
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      step="0.05"
                      min="0.10"
                      max="3.00"
                      value={trussSpacingM}
                      onChange={(e) => setTrussSpacingM(Math.max(0.10, parseFloat(e.target.value) || 0.5))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-mono font-black text-slate-900 text-xs focus:border-emerald-500 outline-none"
                    />
                    <span className="text-xs text-slate-500">m</span>
                  </div>
                </div>
              )}

              {/* Selector de Peralte / Altura del Tijeral */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-bold shrink-0">Peralte / Altura del Tijeral (H):</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[0.30, 0.40, 0.50, 0.60, 0.80, 1.00].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTrussHeightM(h)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        trussHeightM === h
                          ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {h.toFixed(2)}m
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.05"
                    min="0.20"
                    max="2.50"
                    value={trussHeightM}
                    onChange={(e) => setTrussHeightM(Math.max(0.20, parseFloat(e.target.value) || 0.5))}
                    className="w-14 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-center font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-400">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* EXPLICACIÓN DIDÁCTICA AUTOMÁTICA */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Resumen de la Estructura Generada:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
              <div className="bg-white/80 p-1.5 rounded-lg border border-amber-200/60">
                <span className="text-slate-500 block text-[10px]">Área de Cobertura:</span>
                <strong className="text-slate-900">{(luzM * largoM).toFixed(1)} m²</strong>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-amber-200/60">
                <span className="text-slate-500 block text-[10px]">Cúspide / Altura Total:</span>
                <strong className="text-slate-900">
                  {tipo === 'parabolico' ? `${(alturaColM + flechaM).toFixed(2)} m` :
                   tipo === 'dos_aguas' ? `${(alturaColM + (luzM * (pendientePct / 100) / 2)).toFixed(2)} m` :
                   tipo === 'una_agua' ? `${alturaCol2M.toFixed(2)} m` : `${alturaColM.toFixed(2)} m`}
                </strong>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-amber-200/60">
                <span className="text-slate-500 block text-[10px]">N° Tijerales / Ejes:</span>
                <strong className="text-slate-900">{Math.max(2, Math.round(largoM / 4.5) + 1)} pórticos</strong>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-amber-200/60">
                <span className="text-slate-500 block text-[10px]">Tijeral Seleccionado:</span>
                <strong className="text-slate-900 truncate block" title={CATALOGO_TIJERALES_INFO[tipoTijeral]?.nombre || tipoTijeral}>
                  {CATALOGO_TIJERALES_INFO[tipoTijeral]?.nombre || tipoTijeral}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE DIÁLOGO */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGenerarEstructura}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Generar y Ensamblar Techo</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

      </div>
    </div>
  );
};
