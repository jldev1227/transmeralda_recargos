/**
 * @fileoverview Helpers para calcular diferentes tipos de horas y recargos laborales
 * @version 1.0.0
 * @author Tu nombre
 */

// ===== TIPOS E INTERFACES =====

export interface ParametrosCalculo {
  dia: string;
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
  RECARGO_DOMINICAL: 75,
} as const;

export const HORAS_LIMITE = {
  JORNADA_NORMAL: 10,
  INICIO_NOCTURNO: 21,
  FIN_NOCTURNO: 6,
} as const;

// ===== FUNCIONES UTILITARIAS =====

/**
 * Verifica si un día específico es domingo
 * @param dia - Día del mes (1-31)
 * @param mes - Mes (1-12)
 * @param año - Año
 * @returns true si es domingo
 */
export const esDomingo = (dia: string, mes: number, año: number): boolean => {
  const fecha = new Date(año, mes - 1, Number(dia));
  return fecha.getDay() === 0; // 0 = domingo
};

/**
 * Verifica si un día está en la lista de días festivos
 * @param dia - Día del mes (1-31)
 * @param diasFestivos - Array de días festivos del mes
 * @returns true si es día festivo
 */
export const esDiaFestivo = (
  dia: string,
  diasFestivos: number[] = [],
): boolean => {
  return diasFestivos.includes(Number(dia));
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
  dia: string,
  mes: number,
  año: number,
  diasFestivos: number[] = [],
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
  return `${horasEnteras.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;
};

/**
 * Convierte formato HH:MM a decimal
 * @param horaString - Hora en formato HH:MM
 * @returns Hora en formato decimal
 */
export const parsearHora = (horaString: string): number => {
  const [horas, minutos] = horaString.split(":").map(Number);
  return horas + minutos / 60;
};

// ===== FUNCIONES DE CÁLCULO =====

/**
 * Calcula las Horas Extra Diurnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, 0, IF(F9>10,F9-10,0))
 */
export const calcularHoraExtraDiurna = (
  dia: string,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = [],
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
  dia: string,
  mes: number,
  año: number,
  horaFinal: number,
  totalHoras: number,
  diasFestivos: number[] = [],
): number => {
  // Si es domingo o festivo, no hay horas extra nocturnas normales
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    return 0;
  }

  // Si trabajó más de 10 horas Y terminó después de las 21:00
  if (
    totalHoras > HORAS_LIMITE.JORNADA_NORMAL &&
    horaFinal > HORAS_LIMITE.INICIO_NOCTURNO
  ) {
    return redondear(horaFinal - HORAS_LIMITE.INICIO_NOCTURNO);
  }

  return 0;
};

/**
 * Calcula las Horas Extra Festivas Diurnas
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, IF(F9>10,F9-10,0),0)
 */
export const calcularHoraExtraFestivaDiurna = (
  dia: string,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = [],
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
  dia: string,
  mes: number,
  año: number,
  horaFinal: number,
  totalHoras: number,
  diasFestivos: number[] = [],
): number => {
  // Solo si es domingo o festivo
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    // Si trabajó más de 10 horas Y terminó después de las 21:00
    if (
      totalHoras > HORAS_LIMITE.JORNADA_NORMAL &&
      horaFinal > HORAS_LIMITE.INICIO_NOCTURNO
    ) {
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
  dia: string,
  horaInicial: number,
  horaFinal: number,
): number => {
  // Si no hay día registrado, retornar 0
  if (!dia) {
    return 0;
  }

  // Si no hay horas registradas, retornar 0
  if (typeof horaInicial !== "number" || typeof horaFinal !== "number") {
    return 0;
  }

  let recargoNocturno = 0;

  // Recargo por iniciar antes de las 6:00 AM
  if (horaInicial < HORAS_LIMITE.FIN_NOCTURNO) {
    recargoNocturno += HORAS_LIMITE.FIN_NOCTURNO - horaInicial;
  }

  // Recargo por terminar después de las 21:00 (9:00 PM)
  if (horaFinal > HORAS_LIMITE.INICIO_NOCTURNO) {
    if (horaInicial > HORAS_LIMITE.INICIO_NOCTURNO) {
      // Si también inició después de las 21:00, es toda la jornada
      recargoNocturno += horaFinal - horaInicial;
    } else {
      // Solo las horas después de las 21:00
      recargoNocturno += horaFinal - HORAS_LIMITE.INICIO_NOCTURNO;
    }
  }

  return redondear(recargoNocturno);
};

/**
 * Calcula el Recargo Dominical
 * Fórmula: =IF(COUNTIF($R$6:$S$12,C9) > 0, IF(F9<=10,F9,10), 0)
 */
export const calcularRecargoDominical = (
  dia: string,
  mes: number,
  año: number,
  totalHoras: number,
  diasFestivos: number[] = [],
): number => {
  // Solo si es domingo o festivo
  if (esDomingoOFestivo(dia, mes, año, diasFestivos)) {
    // Si trabajó 10 horas o menos, todas son recargo dominical
    // Si trabajó más de 10, solo las primeras 10 son recargo dominical
    return redondear(
      totalHoras <= HORAS_LIMITE.JORNADA_NORMAL
        ? totalHoras
        : HORAS_LIMITE.JORNADA_NORMAL,
    );
  }

  return 0;
};

/**
 * Función principal que calcula todos los tipos de horas y recargos
 */
export const calcularTodasLasHoras = (
  parametros: ParametrosCalculo,
): ResultadosCalculo => {
  const {
    dia,
    mes,
    año,
    horaInicial,
    horaFinal,
    diasFestivos = [],
  } = parametros;

  // Calcular total de horas trabajadas
  const totalHoras = redondear(horaFinal - horaInicial);

  // Calcular todos los tipos
  const resultados: ResultadosCalculo = {
    totalHoras,
    horaExtraDiurna:
      calcularHoraExtraDiurna(dia, mes, año, totalHoras, diasFestivos) -
      calcularHoraExtraNocturna(
        dia,
        mes,
        año,
        horaFinal,
        totalHoras,
        diasFestivos,
      ),
    horaExtraNocturna: calcularHoraExtraNocturna(
      dia,
      mes,
      año,
      horaFinal,
      totalHoras,
      diasFestivos,
    ),
    horaExtraFestivaDiurna: calcularHoraExtraFestivaDiurna(
      dia,
      mes,
      año,
      totalHoras,
      diasFestivos,
    ),
    horaExtraFestivaNocturna: calcularHoraExtraFestivaNocturna(
      dia,
      mes,
      año,
      horaFinal,
      totalHoras,
      diasFestivos,
    ),
    recargoNocturno: calcularRecargoNocturno(dia, horaInicial, horaFinal),
    recargoDominical: calcularRecargoDominical(
      dia,
      mes,
      año,
      totalHoras,
      diasFestivos,
    ),
    esDomingo: esDomingo(dia, mes, año),
    esFestivo: esDiaFestivo(dia, diasFestivos),
    esDomingoOFestivo: esDomingoOFestivo(dia, mes, año, diasFestivos),
  };

  return resultados;
};

/**
 * Obtiene un resumen detallado de todos los tipos de horas calculadas
 */
export const obtenerResumenTipoHoras = (
  resultados: ResultadosCalculo,
): ResumenTipoHoras[] => {
  return [
    {
      tipo: "HED",
      horas: resultados.horaExtraDiurna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_DIURNA}%`,
      descripcion: "Hora Extra Diurna",
    },
    {
      tipo: "HEN",
      horas: resultados.horaExtraNocturna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_NOCTURNA}%`,
      descripcion: "Hora Extra Nocturna",
    },
    {
      tipo: "HEFD",
      horas: resultados.horaExtraFestivaDiurna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_FESTIVA_DIURNA}%`,
      descripcion: "Hora Extra Festiva Diurna",
    },
    {
      tipo: "HEFN",
      horas: resultados.horaExtraFestivaNocturna,
      porcentaje: `${PORCENTAJES_RECARGO.HE_FESTIVA_NOCTURNA}%`,
      descripcion: "Hora Extra Festiva Nocturna",
    },
    {
      tipo: "RN",
      horas: resultados.recargoNocturno,
      porcentaje: `${PORCENTAJES_RECARGO.RECARGO_NOCTURNO}%`,
      descripcion: "Recargo Nocturno",
    },
    {
      tipo: "RD",
      horas: resultados.recargoDominical,
      porcentaje: `${PORCENTAJES_RECARGO.RECARGO_DOMINICAL}%`,
      descripcion: "Recargo Dominical/Festivo",
    },
  ].filter((item) => item.horas > 0); // Solo mostrar tipos con horas > 0
};

/**
 * Calcula los domingos de un mes específico
 */
export const obtenerDomingosDelMes = (mes: number, año: number): number[] => {
  const domingos: number[] = [];
  const diasEnMes = new Date(año, mes, 0).getDate();

  for (let dia = 1; dia <= diasEnMes; dia++) {
    if (esDomingo(dia.toString(), mes, año)) {
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

  if (Number(parametros.dia) < 1 || Number(parametros.dia) > 31) {
    errores.push("El día debe estar entre 1 y 31");
  }

  if (parametros.mes < 1 || parametros.mes > 12) {
    errores.push("El mes debe estar entre 1 y 12");
  }

  if (parametros.año < 1900 || parametros.año > 2100) {
    errores.push("El año debe estar entre 1900 y 2100");
  }

  if (parametros.horaInicial < 0 || parametros.horaInicial > 24) {
    errores.push("La hora inicial debe estar entre 0 y 24");
  }

  if (parametros.horaFinal < 0 || parametros.horaFinal > 24) {
    errores.push("La hora final debe estar entre 0 y 24");
  }

  if (parametros.horaFinal <= parametros.horaInicial) {
    errores.push("La hora final debe ser mayor que la hora inicial");
  }

  return errores;
};

export const formatearCOP = (valor: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
};

// ===== LÓGICA DE DÍAS FESTIVOS COLOMBIA =====
// Festivos fijos en Colombia (misma fecha cada año)
export const festivosFijos = [
  { mes: 1, dia: 1, nombre: "Año Nuevo" },
  { mes: 5, dia: 1, nombre: "Día del Trabajo" },
  { mes: 7, dia: 20, nombre: "Día de la Independencia" },
  { mes: 8, dia: 7, nombre: "Batalla de Boyacá" },
  { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
  { mes: 12, dia: 25, nombre: "Navidad" },
];

// Función para calcular Semana Santa (varía cada año)
export const calcularSemanaSanta = (año: number) => {
  const a = año % 19;
  const b = Math.floor(año / 100);
  const c = año % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = Math.floor((h + l - 7 * m + 114) / 31);
  const p = (h + l - 7 * m + 114) % 31;

  const domingoRamos = new Date(año, n - 1, p + 1 - 7);
  const juevesSanto = new Date(año, n - 1, p + 1 - 3);
  const viernesSanto = new Date(año, n - 1, p + 1 - 2);
  const domingoPascua = new Date(año, n - 1, p + 1);

  return {
    domingoRamos,
    juevesSanto,
    viernesSanto,
    domingoPascua,
  };
};

// Función para calcular festivos que se trasladan al lunes
export const calcularFestivosLunes = (año: number) => {
  const festivos = [
    { mes: 1, dia: 6, nombre: "Reyes Magos" },
    { mes: 3, dia: 19, nombre: "San José" },
    { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 8, dia: 15, nombre: "Asunción de la Virgen" },
    { mes: 10, dia: 12, nombre: "Día de la Raza" },
    { mes: 11, dia: 1, nombre: "Todos los Santos" },
    { mes: 11, dia: 11, nombre: "Independencia de Cartagena" },
  ];

  return festivos.map((festivo) => {
    const fecha = new Date(año, festivo.mes - 1, festivo.dia);
    const diaSemana = fecha.getDay();

    // Si no es lunes (1), calcular el próximo lunes
    if (diaSemana !== 1) {
      const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
      fecha.setDate(fecha.getDate() + diasHastaLunes);
    }

    return {
      fecha,
      nombre: festivo.nombre,
      original: new Date(año, festivo.mes - 1, festivo.dia),
    };
  });
};

interface FestivoTemporal {
  fecha: Date;
  nombre: string;
  tipo: string;
}

// Función principal para obtener todos los festivos del año
export const obtenerFestivosCompletos = (año: number) => {
  const festivos: FestivoTemporal[] = [];

  // Agregar festivos fijos
  festivosFijos.forEach((festivo) => {
    festivos.push({
      fecha: new Date(año, festivo.mes - 1, festivo.dia),
      nombre: festivo.nombre,
      tipo: "fijo",
    });
  });

  // Agregar Semana Santa
  const semanaSanta = calcularSemanaSanta(año);
  festivos.push(
    {
      fecha: semanaSanta.juevesSanto,
      nombre: "Jueves Santo",
      tipo: "religioso",
    },
    {
      fecha: semanaSanta.viernesSanto,
      nombre: "Viernes Santo",
      tipo: "religioso",
    },
  );

  // Agregar festivos que se trasladan al lunes
  const festivosLunes = calcularFestivosLunes(año);
  festivosLunes.forEach((festivo) => {
    festivos.push({
      fecha: festivo.fecha,
      nombre: festivo.nombre,
      tipo: "trasladado",
    });
  });

  // Ordenar por fecha y formatear para el componente
  return festivos
    .sort(
      (a: FestivoTemporal, b: FestivoTemporal) =>
        a.fecha.getTime() - b.fecha.getTime(),
    )
    .map((festivo) => ({
      dia: festivo.fecha.getDate(),
      mes: festivo.fecha.getMonth() + 1,
      año: festivo.fecha.getFullYear(),
      nombre: festivo.nombre,
      tipo: festivo.tipo,
      fechaCompleta: festivo.fecha.toISOString().split("T")[0],
    }));
};

export const getMonthName = (month: number): string => {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[month - 1];
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
  HORAS_LIMITE,
};

export default horasRecargosHelpers;
