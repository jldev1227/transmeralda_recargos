import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Conductor = {
  id: number;
  nombre: string;
  apellido: string;
};

export type Vehiculo = {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  lineas: string;
  color: string;
};

export type Empresa = {
  id: number;
  nombre: string;
  nit: string;
};
