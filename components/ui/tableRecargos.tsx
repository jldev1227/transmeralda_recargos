import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
} from "@heroui/table";
import { 
  Button
} from "@heroui/button";
import { 
  Input
} from "@heroui/input";
import { 
  Chip
} from "@heroui/chip";
import { Clock, Trash2 } from "lucide-react";

// Importar las funciones helpers (ajusta la ruta según tu estructura)
import {
  calcularHoraExtraDiurna,
  calcularHoraExtraNocturna,
  calcularHoraExtraFestivaDiurna,
  calcularHoraExtraFestivaNocturna,
  calcularRecargoNocturno,
  calcularRecargoDominical,
  redondear
} from '@/helpers/index';

interface DiaLaboral {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface TablaRecargosProps {
  diasLaborales: DiaLaboral[];
  actualizarDiaLaboral: (id: string, campo: string, valor: string) => void;
  eliminarDiaLaboral: (id: string) => void;
  mes: number;
  año: number;
  diasFestivos?: number[];
}

const TablaConRecargos: React.FC<TablaRecargosProps> = ({
  diasLaborales,
  actualizarDiaLaboral,
  eliminarDiaLaboral,
  mes,
  año,
  diasFestivos = []
}) => {

  // Función para calcular el total de horas
  const calcularTotalHoras = (horaInicio: string, horaFin: string): number => {
    if (!horaInicio || !horaFin) return 0;
    const inicio = parseFloat(horaInicio);
    const fin = parseFloat(horaFin);
    return fin - inicio;
  };

  // Función para calcular todos los recargos de un día
  const calcularRecargos = (dia: DiaLaboral) => {
    const diaNum = parseInt(dia.dia);
    const horaInicio = parseFloat(dia.horaInicio) || 0;
    const horaFin = parseFloat(dia.horaFin) || 0;
    const totalHoras = calcularTotalHoras(dia.horaInicio, dia.horaFin);

    // Si no hay datos válidos, retornar ceros
    if (!dia.dia || !dia.horaInicio || !dia.horaFin || totalHoras <= 0) {
      return {
        HED: 0,
        HEN: 0,
        HEFD: 0,
        HEFN: 0,
        RN: 0,
        RD: 0
      };
    }

    return {
      HED: calcularHoraExtraDiurna(diaNum, mes, año, totalHoras, diasFestivos),
      HEN: calcularHoraExtraNocturna(diaNum, mes, año, horaFin, totalHoras, diasFestivos),
      HEFD: calcularHoraExtraFestivaDiurna(diaNum, mes, año, totalHoras, diasFestivos),
      HEFN: calcularHoraExtraFestivaNocturna(diaNum, mes, año, horaFin, totalHoras, diasFestivos),
      RN: calcularRecargoNocturno(diaNum, horaInicio, horaFin),
      RD: calcularRecargoDominical(diaNum, mes, año, totalHoras, diasFestivos)
    };
  };

  // Función para formatear el valor de recargo
  const formatearRecargo = (valor: number): string => {
    return valor > 0 ? valor.toFixed(1) : '0';
  };

  // Función para obtener el color del chip según el tipo de recargo
  const obtenerColorRecargo = (tipo: string, valor: number) => {
    if (valor === 0) return 'default';
    
    switch (tipo) {
      case 'HED': return 'success';
      case 'HEN': return 'primary';
      case 'HEFD': return 'warning';
      case 'HEFN': return 'secondary';
      case 'RN': return 'primary';
      case 'RD': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Table removeWrapper aria-label="Tabla de días laborales con recargos">
      <TableHeader>
        <TableColumn>DÍA</TableColumn>
        <TableColumn>HORA INICIO</TableColumn>
        <TableColumn>HORA FIN</TableColumn>
        <TableColumn>TOTAL</TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">HED</span>
            <span className="text-xs text-default-400">25%</span>
          </div>
        </TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">HEN</span>
            <span className="text-xs text-default-400">75%</span>
          </div>
        </TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">HEFD</span>
            <span className="text-xs text-default-400">100%</span>
          </div>
        </TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">HEFN</span>
            <span className="text-xs text-default-400">150%</span>
          </div>
        </TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">RN</span>
            <span className="text-xs text-default-400">35%</span>
          </div>
        </TableColumn>
        <TableColumn className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold">RD</span>
            <span className="text-xs text-default-400">75%</span>
          </div>
        </TableColumn>
        <TableColumn>ACCIONES</TableColumn>
      </TableHeader>
      <TableBody>
        {diasLaborales.map((dia, index) => {
          const recargos = calcularRecargos(dia);
          const totalHoras = calcularTotalHoras(dia.horaInicio, dia.horaFin);
          
          return (
            <TableRow key={dia.id}>
              {/* DÍA */}
              <TableCell>
                <Input
                  type="number"
                  placeholder="01"
                  min="1"
                  max="31"
                  value={dia.dia}
                  onValueChange={(value) =>
                    actualizarDiaLaboral(dia.id, "dia", value)
                  }
                  size="sm"
                />
              </TableCell>

              {/* HORA INICIO */}
              <TableCell>
                <Input
                  type="number"
                  placeholder="8.0"
                  min="0"
                  max="24"
                  step="0.5"
                  value={dia.horaInicio}
                  onValueChange={(value) => {
                    const numValue = parseFloat(value);
                    if (
                      value === "" ||
                      (numValue >= 0 &&
                        numValue <= 24 &&
                        (numValue * 2) % 1 === 0)
                    ) {
                      actualizarDiaLaboral(dia.id, "horaInicio", value);
                    }
                  }}
                  startContent={<Clock size={14} />}
                  endContent={
                    <span className="text-default-400 text-small">hrs</span>
                  }
                  size="sm"
                />
              </TableCell>

              {/* HORA FIN */}
              <TableCell>
                <Input
                  type="number"
                  placeholder="8.0"
                  min="0"
                  max="24"
                  step="0.5"
                  value={dia.horaFin}
                  onValueChange={(value) => {
                    const numValue = parseFloat(value);
                    if (
                      value === "" ||
                      (numValue >= 0 &&
                        numValue <= 24 &&
                        (numValue * 2) % 1 === 0)
                    ) {
                      actualizarDiaLaboral(dia.id, "horaFin", value);
                    }
                  }}
                  startContent={<Clock size={14} />}
                  endContent={
                    <span className="text-default-400 text-small">hrs</span>
                  }
                  size="sm"
                />
              </TableCell>

              {/* TOTAL HORAS */}
              <TableCell>
                {dia.horaInicio && dia.horaFin ? (
                  <span className="text-default-600 font-medium">
                    {(() => {
                      const inicio = parseFloat(dia.horaInicio);
                      const fin = parseFloat(dia.horaFin);
                      const diferencia = fin - inicio;

                      if (diferencia < 0) {
                        return (
                          <span className="text-danger">
                            Error: Hora fin menor que inicio
                          </span>
                        );
                      }

                      if (diferencia > 24) {
                        return (
                          <span className="text-warning">
                            Error: Más de 24 horas
                          </span>
                        );
                      }

                      return `${diferencia.toFixed(1)}`;
                    })()}
                  </span>
                ) : (
                  <span className="text-default-400">-- hrs</span>
                )}
              </TableCell>

              {/* HED - Hora Extra Diurna */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('HED', recargos.HED)}
                  variant={recargos.HED > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.HED)}
                </Chip>
              </TableCell>

              {/* HEN - Hora Extra Nocturna */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('HEN', recargos.HEN)}
                  variant={recargos.HEN > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.HEN)}
                </Chip>
              </TableCell>

              {/* HEFD - Hora Extra Festiva Diurna */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('HEFD', recargos.HEFD)}
                  variant={recargos.HEFD > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.HEFD)}
                </Chip>
              </TableCell>

              {/* HEFN - Hora Extra Festiva Nocturna */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('HEFN', recargos.HEFN)}
                  variant={recargos.HEFN > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.HEFN)}
                </Chip>
              </TableCell>

              {/* RN - Recargo Nocturno */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('RN', recargos.RN)}
                  variant={recargos.RN > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.RN)}
                </Chip>
              </TableCell>

              {/* RD - Recargo Dominical */}
              <TableCell className="text-center">
                <Chip
                  size="sm"
                  color={obtenerColorRecargo('RD', recargos.RD)}
                  variant={recargos.RD > 0 ? 'solid' : 'flat'}
                  className="min-w-[50px]"
                >
                  {formatearRecargo(recargos.RD)}
                </Chip>
              </TableCell>

              {/* ACCIONES */}
              <TableCell>
                {diasLaborales.length > 1 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => eliminarDiaLaboral(dia.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default TablaConRecargos;