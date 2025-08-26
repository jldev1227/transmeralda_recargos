import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Clock, Trash2 } from "lucide-react";

// Importar las funciones helpers (ajusta la ruta según tu estructura)
import {
  calcularHoraExtraDiurna,
  calcularHoraExtraNocturna,
  calcularHoraExtraFestivaDiurna,
  calcularHoraExtraFestivaNocturna,
  calcularRecargoNocturno,
  calcularRecargoDominical,
} from "@/helpers/index";
import { DiaLaboral } from "@/types";

interface TablaRecargosProps {
  diasLaborales: DiaLaboral[];
  actualizarDiaLaboral: (
    id: string,
    campo: keyof DiaLaboral,
    valor: string,
  ) => void;
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
  diasFestivos = [],
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
        RD: 0,
      };
    }

    return {
      HED:
        calcularHoraExtraDiurna(diaNum, mes, año, totalHoras, diasFestivos) -
        calcularHoraExtraNocturna(
          diaNum,
          mes,
          año,
          horaFin,
          totalHoras,
          diasFestivos,
        ),
      HEN: calcularHoraExtraNocturna(
        diaNum,
        mes,
        año,
        horaFin,
        totalHoras,
        diasFestivos,
      ),
      HEFD:
        calcularHoraExtraFestivaDiurna(
          diaNum,
          mes,
          año,
          totalHoras,
          diasFestivos,
        ) -
        calcularHoraExtraFestivaNocturna(
          diaNum,
          mes,
          año,
          horaFin,
          totalHoras,
          diasFestivos,
        ),
      HEFN: calcularHoraExtraFestivaNocturna(
        diaNum,
        mes,
        año,
        horaFin,
        totalHoras,
        diasFestivos,
      ),
      RN: calcularRecargoNocturno(diaNum, horaInicio, horaFin),
      RD: calcularRecargoDominical(diaNum, mes, año, totalHoras, diasFestivos),
    };
  };

  // Función para calcular totales acumulados
  const calcularTotales = () => {
    const totales = {
      totalHoras: 0,
      HED: 0,
      HEN: 0,
      HEFD: 0,
      HEFN: 0,
      RN: 0,
      RD: 0,
    };

    diasLaborales.forEach((dia) => {
      const horasTotales = calcularTotalHoras(dia.horaInicio, dia.horaFin);
      if (horasTotales > 0) {
        totales.totalHoras += horasTotales;
        const recargos = calcularRecargos(dia);
        totales.HED += recargos.HED;
        totales.HEN += recargos.HEN;
        totales.HEFD += recargos.HEFD;
        totales.HEFN += recargos.HEFN;
        totales.RN += recargos.RN;
        totales.RD += recargos.RD;
      }
    });

    return totales;
  };

  // Función para formatear el valor de recargo
  const formatearRecargo = (valor: number): string => {
    return valor > 0 ? valor.toFixed(1) : "0";
  };

  // Función para obtener el color del chip según el tipo de recargo
  const obtenerColorRecargo = (tipo: string, valor: number) => {
    if (valor === 0) return "default";

    switch (tipo) {
      case "HED":
        return "success";
      case "HEN":
        return "primary";
      case "HEFD":
        return "warning";
      case "HEFN":
        return "secondary";
      case "RN":
        return "primary";
      case "RD":
        return "danger";
      default:
        return "default";
    }
  };

  const totales = calcularTotales();

  return (
    <div className="w-full">
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
            const esFestivo = dia.esFestivo

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

                  {esFestivo && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-600 text-xs font-medium">🎉</span>
                      <span className="text-yellow-600 text-xs">Festivo</span>
                    </div>
                  )}
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
                    color={obtenerColorRecargo("HED", recargos.HED)}
                    variant="flat"
                    className="min-w-[50px]"
                  >
                    {formatearRecargo(recargos.HED)}
                  </Chip>
                </TableCell>

                {/* HEN - Hora Extra Nocturna */}
                <TableCell className="text-center">
                  <Chip
                    size="sm"
                    color={obtenerColorRecargo("HEN", recargos.HEN)}
                    variant="flat"
                    className="min-w-[50px]"
                  >
                    {formatearRecargo(recargos.HEN)}
                  </Chip>
                </TableCell>

                {/* HEFD - Hora Extra Festiva Diurna */}
                <TableCell className="text-center">
                  <Chip
                    size="sm"
                    color={obtenerColorRecargo("HEFD", recargos.HEFD)}
                    variant="flat"
                    className="min-w-[50px]"
                  >
                    {formatearRecargo(recargos.HEFD)}
                  </Chip>
                </TableCell>

                {/* HEFN - Hora Extra Festiva Nocturna */}
                <TableCell className="text-center">
                  <Chip
                    size="sm"
                    color={obtenerColorRecargo("HEFN", recargos.HEFN)}
                    variant="flat"
                    className="min-w-[50px]"
                  >
                    {formatearRecargo(recargos.HEFN)}
                  </Chip>
                </TableCell>

                {/* RN - Recargo Nocturno */}
                <TableCell className="text-center">
                  <Chip
                    size="sm"
                    color={obtenerColorRecargo("RN", recargos.RN)}
                    variant="flat"
                    className="min-w-[50px]"
                  >
                    {formatearRecargo(recargos.RN)}
                  </Chip>
                </TableCell>

                {/* RD - Recargo Dominical */}
                <TableCell className="text-center">
                  <Chip
                    size="sm"
                    color={obtenerColorRecargo("RD", recargos.RD)}
                    variant="flat"
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

      {/* Footer personalizado fuera de la tabla */}
      <div className="mt-4 p-4 bg-gradient-to-r from-default-50 to-default-100 rounded-lg border border-default-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-default-700 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Resumen Total del Período
          </h3>
          <div className="text-right">
            <div className="text-sm text-default-500">
              Total de Horas Trabajadas
            </div>
            <div className="text-2xl font-bold text-primary">
              {totales.totalHoras.toFixed(1)} hrs
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* HED - Hora Extra Diurna */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.HED > 0
              ? "bg-white border-success-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.HED > 0 ? "text-success-600" : "text-gray-400"
                }`}
            >
              HED • 25%
            </div>
            <div
              className={`text-sm mb-2 ${totales.HED > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              Hora Extra Diurna
            </div>
            <Chip
              size="lg"
              color={totales.HED > 0 ? "success" : "default"}
              variant={totales.HED > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.HED > 0
                ? "text-success-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.HED)} hrs
            </Chip>
          </div>

          {/* HEN - Hora Extra Nocturna */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.HEN > 0
              ? "bg-white border-primary-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.HEN > 0 ? "text-primary-600" : "text-gray-400"
                }`}
            >
              HEN • 75%
            </div>
            <div
              className={`text-sm mb-2 ${totales.HEN > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              Hora Extra Nocturna
            </div>
            <Chip
              size="lg"
              color={totales.HEN > 0 ? "primary" : "default"}
              variant={totales.HEN > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.HEN > 0
                ? "text-primary-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.HEN)} hrs
            </Chip>
          </div>

          {/* HEFD - Hora Extra Festiva Diurna */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.HEFD > 0
              ? "bg-white border-warning-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.HEFD > 0 ? "text-warning-600" : "text-gray-400"
                }`}
            >
              HEFD • 100%
            </div>
            <div
              className={`text-sm mb-2 ${totales.HEFD > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              H.E. Festiva Diurna
            </div>
            <Chip
              size="lg"
              color={totales.HEFD > 0 ? "warning" : "default"}
              variant={totales.HEFD > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.HEFD > 0
                ? "text-warning-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.HEFD)} hrs
            </Chip>
          </div>

          {/* HEFN - Hora Extra Festiva Nocturna */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.HEFN > 0
              ? "bg-white border-secondary-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.HEFN > 0 ? "text-secondary-600" : "text-gray-400"
                }`}
            >
              HEFN • 150%
            </div>
            <div
              className={`text-sm mb-2 ${totales.HEFN > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              H.E. Festiva Nocturna
            </div>
            <Chip
              size="lg"
              color={totales.HEFN > 0 ? "secondary" : "default"}
              variant={totales.HEFN > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.HEFN > 0
                ? "text-secondary-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.HEFN)} hrs
            </Chip>
          </div>

          {/* RN - Recargo Nocturno */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.RN > 0
              ? "bg-white border-primary-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.RN > 0 ? "text-primary-600" : "text-gray-400"
                }`}
            >
              RN • 35%
            </div>
            <div
              className={`text-sm mb-2 ${totales.RN > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              Recargo Nocturno
            </div>
            <Chip
              size="lg"
              color={totales.RN > 0 ? "primary" : "default"}
              variant={totales.RN > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.RN > 0
                ? "text-primary-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.RN)} hrs
            </Chip>
          </div>

          {/* RD - Recargo Dominical */}
          <div
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${totales.RD > 0
              ? "bg-white border-danger-200 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div
              className={`text-xs font-medium mb-1 ${totales.RD > 0 ? "text-danger-600" : "text-gray-400"
                }`}
            >
              RD • 75%
            </div>
            <div
              className={`text-sm mb-2 ${totales.RD > 0 ? "text-default-500" : "text-gray-400"
                }`}
            >
              Recargo Dominical
            </div>
            <Chip
              size="lg"
              color={totales.RD > 0 ? "danger" : "default"}
              variant={totales.RD > 0 ? "flat" : "bordered"}
              className={`w-full font-bold transition-all duration-200 ${totales.RD > 0
                ? "text-danger-700"
                : "text-gray-400 border-gray-300"
                }`}
            >
              {formatearRecargo(totales.RD)} hrs
            </Chip>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-3 border-t border-default-200 flex flex-wrap justify-between items-center gap-2 text-sm text-default-600">
          <div className="flex items-center gap-4">
            <span>
              📅 Días laborales: <strong>{diasLaborales.length}</strong>
            </span>
            <span>
              ✅ Días con datos:{" "}
              <strong>
                {
                  diasLaborales.filter(
                    (dia) =>
                      dia.dia &&
                      dia.horaInicio &&
                      dia.horaFin &&
                      calcularTotalHoras(dia.horaInicio, dia.horaFin) > 0,
                  ).length
                }
              </strong>
            </span>
          </div>
          <div className="text-xs text-default-500">
            Los porcentajes mostrados corresponden a los recargos legales
            colombianos
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaConRecargos;
