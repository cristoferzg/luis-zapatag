// =============================================================================
// Contrato para revisar dentro del link de la propuesta. Usa las mismas
// cláusulas que el módulo Contratos; el monto, el adelanto y el saldo se arman
// con la opción que el cliente elige (cambian al tocar otra opción).
// =============================================================================

export interface ContratoPropuesta {
  contratista: { nombre: string; ruc?: string; direccion?: string; telefono?: string };
  servicio: string;                 // p. ej. "Techo metálico"
  adelantoPct: number;              // % del total a la firma
  plazo?: string;                   // p. ej. "15 días hábiles desde el adelanto"
  materiales?: string[];            // resumen de materiales del diseño
  pagos?: { banco?: string; titular?: string; cuenta?: string; cci?: string; yape?: string };
}

export interface ClausulaContrato { titulo: string; texto: string[] }

const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function clausulasContrato(c: ContratoPropuesta, d: {
  cliente: string; dni?: string; direccion?: string; proyecto: string; ubicacion?: string;
  total: number; opcion: string; cobertura: string; incluye: string[];
}): { titulo: string; intro: string; clausulas: ClausulaContrato[] } {
  const adelanto = Math.round(d.total * (c.adelantoPct / 100) * 100) / 100;
  const saldo = Math.round((d.total - adelanto) * 100) / 100;
  const pagos = c.pagos || {};
  const cuentas = [
    pagos.titular && `Titular: ${pagos.titular}`,
    pagos.cuenta && `Cuenta ${pagos.banco || ''}: ${pagos.cuenta}`.replace('  ', ' '),
    pagos.cci && `CCI: ${pagos.cci}`,
    pagos.yape && `Yape / Plin: ${pagos.yape}`,
  ].filter(Boolean) as string[];
  const clausulas: ClausulaContrato[] = [
    { titulo: 'OBJETO DEL CONTRATO', texto: [`EL CLIENTE contrata a EL CONTRATISTA para la ejecución de la obra "${d.proyecto}"${d.ubicacion ? ` ubicada en ${d.ubicacion}` : ''}, especializada en ${c.servicio}, en la opción ${d.opcion} (${d.cobertura}).`] },
    { titulo: 'PRESUPUESTO Y FORMA DE PAGO', texto: [
      `El presupuesto total acordado es de ${S(d.total)}.`,
      `• Adelanto (${c.adelantoPct}%): ${S(adelanto)} a la firma del contrato y/o inicio de obra.`,
      `• Saldo: ${S(saldo)}, según el avance de obra o a la entrega final y conformidad del cliente.`,
      ...(cuentas.length ? ['Cuentas autorizadas para el pago:', ...cuentas.map(t => `• ${t}`)] : []),
    ] },
    { titulo: 'ESPECIFICACIONES TÉCNICAS', texto: d.incluye.map(t => `• ${t}`) },
    ...(c.materiales?.length ? [{ titulo: 'MATERIALES A EMPLEAR', texto: c.materiales.map(t => `• ${t}`) }] : []),
    ...(c.plazo ? [{ titulo: 'PLAZO DE EJECUCIÓN', texto: [`La obra se ejecutará en ${c.plazo}.`] }] : []),
    { titulo: 'CONDICIONES EXTERNAS Y AJUSTES DE PRESUPUESTO', texto: ['Queda expresamente establecido que el presupuesto total y los plazos de ejecución del proyecto están sujetos a modificaciones según las características finales del perímetro, área de trabajo y las condiciones climáticas que se presenten durante la obra. Cualquier gasto o ajuste adicional derivado de estos factores externos será reevaluado a favor de EL CONTRATISTA.'] },
    { titulo: 'CANCELACIÓN O RESOLUCIÓN CONTRACTUAL POR ALCANCE O VARIACIÓN DE COSTOS', texto: ['Se establece expresamente que EL CONTRATISTA se reserva la facultad y el derecho de resolver o cancelar unilateralmente el presente contrato en cualquier momento, sin penalidad ni responsabilidad alguna, en caso de que los costos operativos, especificaciones técnicas no previstas, imprevistos técnicos o variaciones en la zona de trabajo superen el alcance del presupuesto acordado o impidan la viabilidad económica del proyecto. Lo estipulado se ampara legalmente en el Artículo 1769º y el Artículo 1777º del Código Civil Peruano (Decreto Legislativo Nº 295).'] },
    { titulo: 'CONFORMIDAD', texto: ['Ambas partes declaran su conformidad con los términos del presente documento, firmándolo en señal de aceptación.'] },
  ];
  // Numeración correlativa (sin saltos si falta materiales o plazo).
  const ORD = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO'];
  clausulas.forEach((cl, i) => { cl.titulo = `${ORD[i] || i + 1}: ${cl.titulo}`; });
  const k = c.contratista;
  return {
    titulo: `CONTRATO DE SERVICIOS - ${c.servicio.toUpperCase()}`,
    intro: `Conste por el presente documento el CONTRATO DE PRESTACIÓN DE SERVICIOS que celebran de una parte ${k.nombre || 'EL CONTRATISTA'}${k.ruc ? ` con RUC/DNI ${k.ruc}` : ''}${k.direccion ? `, domiciliado en ${k.direccion}` : ''}, en adelante "EL CONTRATISTA"; y de la otra parte ${d.cliente || 'EL CLIENTE'}${d.dni ? ` con DNI/RUC ${d.dni}` : ''}${d.direccion ? `, domiciliado en ${d.direccion}` : ''}, en adelante "EL CLIENTE", en los términos y condiciones siguientes:`,
    clausulas,
  };
}
