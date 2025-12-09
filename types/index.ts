import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Conductor = {
  id: string;
  nombre: string;
  apellido: string;
  numero_identificacion: number;
  sede_trabajo: string;
  telefono?: number;
  email?: string;
};

export type Vehiculo = {
  id: string;
  placa: string;
  marca: string;
  linea: string;
  modelo: string;
  color: string;
  clase_vehiculo: string;
};

export type Empresa = {
  id: string;
  nombre: string;
  nit: string;
};

export type DiaLaboral = {
  id: string;
  dia: string;
  mes?: string;
  año?: string;
  hora_inicio: string;
  hora_fin: string;
  kilometraje_inicial?: number | null;
  kilometraje_final?: number | null;
  es_domingo: boolean;
  es_festivo: boolean;
  disponibilidad: boolean;
};

export type DiaLaboralServidor = {
  id: string;
  dia: number; // Viene como número del servidor
  hora_inicio: string;
  hora_fin: string;
  kilometraje_inicial?: number | null;
  kilometraje_final?: number | null;
  es_domingo: boolean;
  es_festivo: boolean;
  disponibilidad: boolean ;
  // No tiene mes ni año
};

export type ConfiguracionSalario = {
  /** ID único de la configuración */
  id: string;

  /** ID de la empresa (null para configuración global) */
  empresa_id: string | null; // ← CORREGIDO: debe poder ser null

  empresa: Empresa | null;

  /** Salario básico mensual */
  salario_basico: number;

  /** Valor por hora del trabajador */
  valor_hora_trabajador: number;

  /** Horas base mensuales para cálculos (default: 240) */
  horas_mensuales_base: number;

  sede: string;

  /** Fecha desde la cual es válida esta configuración */
  vigencia_desde: Date | string;

  /** Fecha hasta la cual es válida (null = sin límite) */
  vigencia_hasta: Date | string | null;

  /** Paga dias festivos con bono */
  paga_dias_festivos?: boolean;

  /** Estado activo de la configuración */
  activo: boolean;

  /** Observaciones sobre esta configuración salarial */
  observaciones: string | null;

  /** ID del usuario que creó la configuración */
  creado_por_id: string | null;
};
