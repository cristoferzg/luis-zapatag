import { INVENTARIO_PERFILES_TUBULARES } from '../components/techos/techosCadCatalog';

export interface E090ProfileAnalysis {
  elementType: string;
  requiredMomentCapacity: number;
  requiredShearCapacity: number;
  maxDeflection: number;
  recommendedProfiles: Array<{
    id: string;
    codigoComercial: string;
    weight: number;
    momentCapacity: number;
    shearCapacity: number;
    deflection: number;
    costPerMeter: number;
    compliant: boolean;
    reason?: string;
  }>;
  currentProfile?: {
    id: string;
    codigoComercial: string;
    weight: number;
    compliant: boolean;
  };
}

export const calculateLoadPerUnitLength = (
  _luz: number,
  largo: number,
  tipoCobertura: 'chapa_galvanizada' | 'acrilico' | 'policarbonato' = 'chapa_galvanizada'
): number => {
  const coberturaWeight: Record<string, number> = {
    chapa_galvanizada: 5.5,
    acrilico: 2.5,
    policarbonato: 2.0
  };

  const weight = coberturaWeight[tipoCobertura] || 5.5;
  const tributaryWidth = largo / 2;

  return weight * tributaryWidth / 1000;
};

export const calculateE090Requirements = (
  tipoTecho: string,
  luz: number,
  largo: number,
  _alturaCol: number,
  tipoCobertura: 'chapa_galvanizada' | 'acrilico' | 'policarbonato' = 'chapa_galvanizada'
): E090ProfileAnalysis => {

  const carga = calculateLoadPerUnitLength(luz, largo, tipoCobertura);
  let loadFactor = 1.5;

  const fy = 48;

  let qDesign = carga * loadFactor;

  if (tipoTecho === 'dos_aguas' || tipoTecho === 'parabolico') {
    qDesign *= 1.1;
  }

  const momentRequired = (qDesign * Math.pow(luz, 2)) / 8;
  const shearRequired = qDesign * luz / 2;
  const deflectionLimit = luz / 300;

  const allProfiles = INVENTARIO_PERFILES_TUBULARES.map((prof: any) => {
    const area = prof.area || 0;
    const ix = prof.ix || 0;

    const sx = ix > 0 ? ix / (prof.lado / 1000 / 2) : 0;
    const momentCapacity = (sx * fy) / 1000;
    const shearCapacity = (area * fy * 0.6) / 1000;

    const deflectionActual = (5 * qDesign * Math.pow(luz, 4)) / (384 * 200000 * ix * Math.pow(10, -8));

    const isCompliant =
      momentCapacity >= momentRequired &&
      shearCapacity >= shearRequired &&
      deflectionActual <= deflectionLimit;

    return {
      id: prof.id,
      codigoComercial: prof.codigoComercial,
      weight: prof.pesoMetro || 0,
      momentCapacity,
      shearCapacity,
      deflection: deflectionActual,
      costPerMeter: prof.costPerMeter || 0,
      compliant: isCompliant,
      reason: !isCompliant
        ? `${momentCapacity < momentRequired ? 'Momento insuficiente ' : ''}${shearCapacity < shearRequired ? 'Cortante insuficiente ' : ''}${deflectionActual > deflectionLimit ? 'Flecha excesiva' : ''}`.trim()
        : undefined
    };
  });

  const compliantProfiles = allProfiles.filter((p: any) => p.compliant).sort((a: any, b: any) => a.weight - b.weight);

  const recommendedProfiles = compliantProfiles.slice(0, 5);

  return {
    elementType: tipoTecho,
    requiredMomentCapacity: momentRequired,
    requiredShearCapacity: shearRequired,
    maxDeflection: deflectionLimit,
    recommendedProfiles,
    currentProfile: undefined
  };
};

export const analyzeProfileDowngrade = (
  currentProfileId: string,
  newProfileId: string,
  _tipoTecho: string,
  luz: number,
  _largo: number,
  elementRole: 'viga_principal' | 'cordon_superior' | 'montante' | 'diagonal' = 'viga_principal'
): {
  isDowngrade: boolean;
  riskLevel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'SEGURO';
  recommendation: string;
} => {

  const current = INVENTARIO_PERFILES_TUBULARES.find((p: any) => p.id === currentProfileId);
  const newProf = INVENTARIO_PERFILES_TUBULARES.find((p: any) => p.id === newProfileId);

  if (!current || !newProf) {
    return {
      isDowngrade: false,
      riskLevel: 'BAJO',
      recommendation: 'Perfil no encontrado'
    };
  }

  const currentWeight = (current as any).pesoMetro || 0;
  const newWeight = (newProf as any).pesoMetro || 0;
  const isDowngrade = newWeight < currentWeight;

  if (!isDowngrade) {
    return {
      isDowngrade: false,
      riskLevel: 'SEGURO',
      recommendation: `Upgrade seguro: ${(newProf as any).codigoComercial} (${newWeight.toFixed(2)} kg/m) es más resistente`
    };
  }

  const criticalElements = ['viga_principal', 'cordon_superior'];
  const weightReduction = ((currentWeight - newWeight) / currentWeight) * 100;

  let riskLevel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'SEGURO';

  if (criticalElements.includes(elementRole)) {
    if (weightReduction > 20) {
      riskLevel = 'CRITICO';
    } else if (weightReduction > 10) {
      riskLevel = 'ALTO';
    } else {
      riskLevel = 'MEDIO';
    }
  } else {
    if (weightReduction > 30) {
      riskLevel = 'ALTO';
    } else if (weightReduction > 15) {
      riskLevel = 'MEDIO';
    } else {
      riskLevel = 'BAJO';
    }
  }

  return {
    isDowngrade: true,
    riskLevel,
    recommendation: `Downgrade de ${weightReduction.toFixed(1)}% en ${elementRole}. Verificar E.090 requisitos para luz de ${luz.toFixed(1)}m`
  };
};
