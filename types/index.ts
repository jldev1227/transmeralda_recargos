import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Conductor = {
  id: number;
  nombre: string;
  apellido: string;
  numero_identificacion: number;
};

export type Vehiculo = {
  id: number;
  placa: string;
  marca: string;
  linea: string;
  modelo: string;
  color: string;
};

export type Empresa = {
  id: string;
  nombre: string;
  nit: string;
};

export type DiaLaboral = {
  id: string;
  dia: string;
  mes: string;
  año: string;
  horaInicio: string;
  horaFin: string;
  esFestivo: boolean
};

export type ConfiguracionSalario = {
  /** ID único de la configuración */
  id: string;

  /** ID de la empresa (null para configuración global) */
  empresa_id: string | null; // ← CORREGIDO: debe poder ser null

  /** Salario básico mensual */
  salario_basico: number;

  /** Valor por hora del trabajador */
  valor_hora_trabajador: number;

  /** Horas base mensuales para cálculos (default: 240) */
  horas_mensuales_base: number;

  /** Fecha desde la cual es válida esta configuración */
  vigencia_desde: Date | string;

  /** Fecha hasta la cual es válida (null = sin límite) */
  vigencia_hasta: Date | string | null;

  /** Estado activo de la configuración */
  activo: boolean;

  /** Observaciones sobre esta configuración salarial */
  observaciones: string | null;

  /** ID del usuario que creó la configuración */
  creado_por_id: string | null;
};
