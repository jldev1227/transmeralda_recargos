/**
 * @fileoverview Helpers para calcular diferentes tipos de horas y recargos laborales
 * @version 1.0.0
 * @author Tu nombre
 */

// ===== TIPOS E INTERFACES =====

export interface ParametrosCalculo {
  dia: number;
  mes: number;
  año: number;
  horaInicial: number;
  horaFinal: number;
  diasFestivos?: number[];
}

export interface ResultadosCalculo {
  totalHoras: number;
  horaExtraDiurna: number;
  horaExtraNocturna: number;
  horaExtraFestivaDiurna: number;
  horaExtraFestivaNocturna: number;
  recargoNocturno: number;
  recargoDominical: number;
  esDomingo: boolean;
  esFestivo: boolean;
  esDomingoOFestivo: boolean;
}

export interface ResumenTipoHoras {
  tipo: string;
  horas: number;
  porcentaje: string;
  descripcion: string;
}

// ===== CONSTANTES =====

export const PORCENTAJES_RECARGO = {
  HE_DIURNA: 25,
  HE_NOCTURNA: 75,
  HE_FESTIVA_DIURNA: 100,
  HE_FESTIVA_NOCTURNA: 150,
  RECARGO_NOCTURNO: 35,
  RECARGO_DOMINICAL: 75
} as const;

export const HORAS_LIMITE = {
  JORNADA_NORMAL: 10,
  INICIO_NOCTURNO: 21,
  FIN_NOCTURNO: 6
} as const;

// ===== FUNCIONES UTILITARIAS =====

/**
 * Verifica si un día específico es domingo
 * @param dia - Día del mes (1-31)
 * @param mes - Mes (1-12)
 * @param año - Año
 * @returns true si es domingo
 */
export const esDomingo = (dia: number, mes: number, año: number): boolean => {
  const fecha = new Date(año, mes - 1, dia);
  return fecha.getDay() === 0; // 0 = domingo
};

/**
 * Verifica si un día está en la lista de días festivos
 * @param dia - Día del mes (1-31)
 * @param diasFestivos - Array de días festivos del mes
 * @returns true si es día festivo
 */
export const esDiaFestivo = (dia: number, diasFestivos: number[] = []): boolean => {
  return diasFestivos.includes(dia);
};

/**
 * Verifica si un día es domingo O festivo
 * @param dia - Día del mes
 * @param mes - Mes
 * @param año - Año
 * @param diasFestivos - Array de días festivos del mes
 * @returns true si es domingo o festivo
 */
export const esDomingoOFestivo = (
  dia: number, 
  mes: number, 
  año: number, 
  diasFestivos: number[] = []
): boolean => {
  return esDomingo(dia, mes, año) || esDiaFestivo(dia, diasFestivos);
};

/**
 * Redondea un número a la cantidad de decimales especificada
 * @param numero - Número a redondear
 * @param decimales - Cantidad de decimales (default: 2)
 * @returns Número redondeado
 */
export const redondear = (numero: number, decimales: number = 2): number => {
  const factor = Math.pow(10, decimales);
  return Math.round(numero * factor) / factor;
};

/**
 * Convierte horas en formato decimal a formato HH:MM
 * @param horas - Horas en formato decimal (ej: 8.5 = 8:30)
 * @returns String en formato HH:MM
 */
export const formatearHoras = (horas: number): string => {
  const horasEnteras = Math.floor(horas);
  const minutos = Math.round((horas - horasEnteras) * 60);
  return `${horasEnteras.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};

/**
 * Convierte formato HH:MM a decimal
 * @param horaString - Hora en formato HH:MM
 * @returns Hora en formato decimal
 */
export const parsearHora = (horaString: string): number => {
  const [horas, minutos] = horaString.split(':').map(Number);
  return horas + (minutos / 60);
};

// ===== FUNCIONES DE CÁLCULO =====

/**
 * Calcula las Horas Extra Diurnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, 0, IF(F9>10,F9-10,0))
 */
export const calcularHoraExtraDiurna = (
  dia: number,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = []
): number => {
  // Si es domingo o festivo, no hay horas extra diurnas normales
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    return 0;
  }
  
  // Si trabajó más de 10 horas, calcular extra diurna
  if (totalHoras > HORAS_LIMITE.JORNADA_NORMAL) {
    return redondear(totalHoras - HORAS_LIMITE.JORNADA_NORMAL);
  }
  
  return 0;
};

/**
 * Calcula las Horas Extra Nocturnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, 0, IF(AND(F9>10,E9>21),E9-21,0))
 */
export const calcularHoraExtraNocturna = (
  dia: number,
  mes: number,
  año: number,
  horaFinal: number,
  totalHoras: number,
  diasFestivos: number[] = []
): number => {
  // Si es domingo o festivo, no hay horas extra nocturnas normales
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    return 0;
  }
  
  // Si trabajó más de 10 horas Y terminó después de las 21:00
  if (totalHoras > HORAS_LIMITE.JORNADA_NORMAL && horaFinal > HORAS_LIMITE.INICIO_NOCTURNO) {
    return redondear(horaFinal - HORAS_LIMITE.INICIO_NOCTURNO);
  }
  
  return 0;
};

/**
 * Calcula las Horas Extra Festivas Diurnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, IF(F9>10,F9-10,0),0)
 */
export const calcularHoraExtraFestivaDiurna = (
  dia: number,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = []
): number => {
  // Solo si es domingo o festivo
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    if (totalHoras > HORAS_LIMITE.JORNADA_NORMAL) {
      return redondear(totalHoras - HORAS_LIMITE.JORNADA_NORMAL);
    }
  }
  
  return 0;
};

/**
 * Calcula las Horas Extra Festivas Nocturnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, IF(AND(F9>10,E9>21),E9-21,0), 0)
 */
export const calcularHoraExtraFestivaNocturna = (
  dia: number,
  mes: number,
  año: number,
  horaFinal: number,
  totalHoras: number,
  diasFestivos: number[] = []
): number => {
  // Solo si es domingo o festivo
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    // Si trabajó más de 10 horas Y terminó después de las 21:00
    if (totalHoras > HORAS_LIMITE.JORNADA_NORMAL && horaFinal > HORAS_LIMITE.INICIO_NOCTURNO) {
      return redondear(horaFinal - HORAS_LIMITE.INICIO_NOCTURNO);
    }
  }
  
  return 0;
};

/**
 * Calcula el Recargo Nocturno
 * Fórmula: =IF(C9<>"",IF(AND(D9<>"",E9<>""),(IF(D9<6,6-D9)+IF(E9>21,IF((D9>21),E9-D9,E9-21))),0),0)
 */
export const calcularRecargoNocturno = (
  dia: number,
  horaInicial: number,
  horaFinal: number
): number => {
  // Si no hay día registrado, retornar 0
  if (!dia) {
    return 0;
  }
  
  // Si no hay horas registradas, retornar 0
  if (!horaInicial || !horaFinal) {
    return 0;
  }
  
  let recargoNocturno = 0;
  
  // Recargo por iniciar antes de las 6:00 AM
  if (horaInicial < HORAS_LIMITE.FIN_NOCTURNO) {
    recargoNocturno += (HORAS_LIMITE.FIN_NOCTURNO - horaInicial);
  }
  
  // Recargo por terminar después de las 21:00 (9:00 PM)
  if (horaFinal > HORAS_LIMITE.INICIO_NOCTURNO) {
    if (horaInicial > HORAS_LIMITE.INICIO_NOCTURNO) {
      // Si también inició después de las 21:00, es toda la jornada
      recargoNocturno += (horaFinal - horaInicial);
    } else {
      // Solo las horas después de las 21:00
      recargoNocturno += (horaFinal - HORAS_LIMITE.INICIO_NOCTURNO);
    }
  }
  
  return redondear(recargoNocturno);
};

/**
 * Calcula el Recargo Dominical
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, IF(F9<=10,F9,10), 0)
 */
export const calcularRecargoDominical = (
  dia: number,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = []
): number => {
  // Solo si es domingo o festivo
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    // Si trabajó 10 horas o menos, todas son recargo dominical
    // Si trabajó más de 10, solo las primeras 10 son recargo dominical
    return redondear(totalHoras <= HORAS_LIMITE.JORNADA_NORMAL ? totalHoras : HORAS_LIMITE.JORNADA_NORMAL);
  }
  
  return 0;
};

/**
 * Función principal que calcula todos los tipos de horas y recargos
 */
export const calcularTodasLasHoras = (parametros: ParametrosCalculo): ResultadosCalculo => {
  const {
    dia,
    mes,
    año,
    horaInicial,
    horaFinal,
    diasFestivos = []
  } = parametros;
  
  // Calcular total de horas trabajadas
  const totalHoras = redondear(horaFinal - horaInicial);
  
  // Calcular todos los tipos
  const resultados: ResultadosCalculo = {
    totalHoras,
    horaExtraDiurna: calcularHoraExtraDiurna(dia, mes, año, totalHoras, diasFestivos),
    horaExtraNocturna: calcularHoraExtraNocturna(dia, mes, año, horaFinal, totalHoras, diasFestivos),
    horaExtraFestivaDiurna: calcularHoraExtraFestivaDiurna(dia, mes, año, totalHoras, diasFestivos),
    horaExtraFestivaNocturna: calcularHoraExtraFestivaNocturna(dia, mes, año, horaFinal, totalHoras, diasFestivos),
    recargoNocturno: calcularRecargoNocturno(dia, horaInicial, horaFinal),
    recargoDominical: calcularRecargoDominical(dia, mes, año, totalHoras, diasFestivos),
    esDomingo: esDomingo(dia, mes, año),
    esFestivo: esDiaFestivo(dia, diasFestivos),
    esDomingoOFestivo: esDomingoOFestivo(dia, mes, año, diasFestivos)
  };
  
  return resultados;
};

/**
 * Obtiene un resumen detallado de todos los tipos de horas calculadas
 */
export const obtenerResumenTipoHoras = (resultados: ResultadosCalculo): ResumenTipoHoras[] => {
  return [
    {
      tipo: 'HED',
      horas: resultados.horaExtraDiurna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_DIURNA}%`,
      descripcion: 'Hora Extra Diurna'
    },
    {
      tipo: 'HEN',
      horas: resultados.horaExtraNocturna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_NOCTURNA}%`,
      descripcion: 'Hora Extra Nocturna'
    },
    {
      tipo: 'HEFD',
      horas: resultados.horaExtraFestivaDiurna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_FESTIVA_DIURNA}%`,
      descripcion: 'Hora Extra Festiva Diurna'
    },
    {
      tipo: 'HEFN',
      horas: resultados.horaExtraFestivaNocturna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_FESTIVA_NOCTURNA}%`,
      descripcion: 'Hora Extra Festiva Nocturna'
    },
    {
      tipo: 'RN',
      horas: resultados.recargoNocturno,
      porcentaje: `${PORCENTAJES_RECARGO.RECARGO_NOCTURNO}%`,
      descripcion: 'Recargo Nocturno'
    },
    {
      tipo: 'RD',
      horas: resultados.recargoDominical,
      porcentaje: `${PORCENTAJES_RECARGO.RECARGO_DOMINICAL}%`,
      descripcion: 'Recargo Dominical/Festivo'
    }
  ].filter(item => item.horas > 0); // Solo mostrar tipos con horas > 0
};

/**
 * Calcula los domingos de un mes específico
 */
export const obtenerDomingosDelMes = (mes: number, año: number): number[] => {
  const domingos: number[] = [];
  const diasEnMes = new Date(año, mes, 0).getDate();
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    if (esDomingo(dia, mes, año)) {
      domingos.push(dia);
    }
  }
  
  return domingos;
};

/**
 * Valida los parámetros de entrada
 */
export const validarParametros = (parametros: ParametrosCalculo): string[] => {
  const errores: string[] = [];
  
  if (parametros.dia < 1 || parametros.dia > 31) {
    errores.push('El día debe estar entre 1 y 31');
  }
  
  if (parametros.mes < 1 || parametros.mes > 12) {
    errores.push('El mes debe estar entre 1 y 12');
  }
  
  if (parametros.año < 1900 || parametros.año > 2100) {
    errores.push('El año debe estar entre 1900 y 2100');
  }
  
  if (parametros.horaInicial < 0 || parametros.horaInicial > 24) {
    errores.push('La hora inicial debe estar entre 0 y 24');
  }
  
  if (parametros.horaFinal < 0 || parametros.horaFinal > 24) {
    errores.push('La hora final debe estar entre 0 y 24');
  }
  
  if (parametros.horaFinal <= parametros.horaInicial) {
    errores.push('La hora final debe ser mayor que la hora inicial');
  }
  
  return errores;
};

// ===== EXPORT DEFAULT =====

const horasRecargosHelpers = {
  // Funciones principales
  calcularTodasLasHoras,
  obtenerResumenTipoHoras,
  
  // Funciones individuales
  calcularHoraExtraDiurna,
  calcularHoraExtraNocturna,
  calcularHoraExtraFestivaDiurna,
  calcularHoraExtraFestivaNocturna,
  calcularRecargoNocturno,
  calcularRecargoDominical,
  
  // Utilidades
  esDomingo,
  esDiaFestivo,
  esDomingoOFestivo,
  redondear,
  formatearHoras,
  parsearHora,
  obtenerDomingosDelMes,
  validarParametros,
  
  // Constantes
  PORCENTAJES_RECARGO,
  HORAS_LIMITE
};

export default horasRecargosHelpers;