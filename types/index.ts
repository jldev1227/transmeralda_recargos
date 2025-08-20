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
  id: number;
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
};
