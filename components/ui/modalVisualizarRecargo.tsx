import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Eye,
  X,
  User,
  Car,
  Building2,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react";
import { RecargoDetallado, useRecargo } from "@/context/RecargoPlanillaContext";
import { addToast } from "@heroui/toast";

interface ModalVisualizarRecargoProps {
  recargoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// ✅ Interfaces actualizadas para coincidir con la respuesta del backend
interface DiaLaboral {
  id: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  total_horas: number;
  es_especial: boolean;
  es_domingo: boolean;
  es_festivo: boolean;
  hed: number;
  hen: number;
  hefd: number;
  hefn: number;
  rn: number;
  rd: number;
}

// ✅ Componente optimizado con memoización
const ModalVisualizarRecargo = React.memo<ModalVisualizarRecargoProps>(
  ({ recargoId, isOpen, onClose }) => {
    const [recargo, setRecargo] = useState<RecargoDetallado | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mesAño, setMesAño] = useState<{ mes: number; año: number } | null>(
      null,
    );

    const { obtenerRecargoPorId } = useRecargo();

    // ✅ Función optimizada para cargar datos del recargo
    const cargarDatosRecargo = useCallback(
      async (id: string) => {
        try {
          setIsLoadingData(true);
          setError(null);

          const response = await obtenerRecargoPorId(id);

          if (response?.success && response.data?.recargo) {
            setRecargo(response.data.recargo);
            setMesAño({ mes: response.data.mes, año: response.data.año });
          } else {
            throw new Error("No se encontró información del recargo");
          }
        } catch (error) {
          console.error("Error cargando datos del recargo:", error);
          setError("No se pudo cargar la información del recargo");
          addToast({
            title: "Error",
            description: "No se pudo cargar la información del recargo",
            color: "danger",
          });
        } finally {
          setIsLoadingData(false);
        }
      },
      [obtenerRecargoPorId],
    );

    // ✅ Efecto optimizado para cargar datos
    useEffect(() => {
      if (recargoId && isOpen) {
        cargarDatosRecargo(recargoId);
      }
    }, [isOpen, recargoId, cargarDatosRecargo]);

    // ✅ Función optimizada para cerrar modal
    const handleClose = useCallback(() => {
      setRecargo(null);
      setError(null);
      setMesAño(null);
      onClose();
    }, [onClose]);

    // ✅ Función helper memoizada para formatear horas
    const formatearHoras = useCallback(
      (horas: number | string | undefined): string => {
        if (!horas) return "0.0";
        const num = typeof horas === "string" ? parseFloat(horas) : horas;
        return isNaN(num) ? "0.0" : num.toFixed(1);
      },
      [],
    );

    // ✅ Función memoizada para obtener nombre del mes
    const obtenerNombreMes = useCallback((mes: number): string => {
      const meses = [
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
      return meses[mes - 1] || "Mes inválido";
    }, []);

    // ✅ Información del recargo memoizada
    const infoRecargo = useMemo(() => {
      if (!recargo || !mesAño) return null;

      return {
        conductor: recargo.conductor,
        vehiculo: recargo.vehiculo,
        empresa: recargo.empresa,
        planilla:
          recargo.planilla ||
          `Planilla ${obtenerNombreMes(mesAño.mes)} ${mesAño.año}`,
        totalDias: recargo.total_dias,
        mesAño: `${obtenerNombreMes(mesAño.mes)} ${mesAño.año}`,
      };
    }, [recargo, mesAño, obtenerNombreMes]);

    // ✅ Totales desde el backend (ya calculados)
    const totales = useMemo(() => {
      if (
        !recargo ||
        !recargo.dias_laborales ||
        !Array.isArray(recargo.dias_laborales)
      ) {
        return {
          totalHoras: 0,
          totalesRecargos: { HED: 0, HEN: 0, HEFD: 0, HEFN: 0, RN: 0, RD: 0 },
        };
      }

      // Calcular totales sumando los valores de todos los días laborales
      const totalesRecargos = recargo.dias_laborales.reduce(
        (acumulador, dia) => ({
          HED: acumulador.HED + (dia.hed || 0),
          HEN: acumulador.HEN + (dia.hen || 0),
          HEFD: acumulador.HEFD + (dia.hefd || 0),
          HEFN: acumulador.HEFN + (dia.hefn || 0),
          RN: acumulador.RN + (dia.rn || 0),
          RD: acumulador.RD + (dia.rd || 0),
        }),
        { HED: 0, HEN: 0, HEFD: 0, HEFN: 0, RN: 0, RD: 0 },
      );

      return {
        totalHoras: recargo.total_horas || 0,
        totalesRecargos,
      };
    }, [recargo]);

    // ✅ Componente de Card de Día memoizado
    const DiaCard = React.memo(
      ({ dia, index }: { dia: DiaLaboral; index: number }) => {
        const recargosDelDia = {
          HED: dia.hed || 0,
          HEN: dia.hen || 0,
          HEFD: dia.hefd || 0,
          HEFN: dia.hefn || 0,
          RN: dia.rn || 0,
          RD: dia.rd || 0,
        };

        const tieneRecargos = Object.values(recargosDelDia).some(
          (valor) => valor > 0,
        );

        return (
          <Card
            key={`dia-${dia.dia}-${index}`}
            className={`border-2 ${
              dia.es_especial
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    Día {dia.dia}
                  </span>
                  {dia.es_especial && (
                    <Chip size="sm" color="danger" variant="flat">
                      {dia.es_domingo ? "DOM" : "FEST"}
                    </Chip>
                  )}
                </div>
                {tieneRecargos && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              {/* Horas trabajadas */}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-gray-500" />
                <span className="font-medium">
                  {formatearHoras(dia.total_horas)}h trabajadas
                </span>
              </div>

              {/* Horario */}
              <div className="text-xs text-gray-600">
                <span>
                  Horario: {dia.hora_inicio}:00 - {dia.hora_fin}:00
                </span>
              </div>

              {/* Recargos */}
              {tieneRecargos && (
                <div className="space-y-1">
                  {recargosDelDia.HED > 0 && (
                    <div className="flex justify-between text-xs bg-green-100 px-2 py-1 rounded">
                      <span className="text-green-700 font-medium">HED:</span>
                      <span className="text-green-800 font-bold">
                        {formatearHoras(recargosDelDia.HED)}h
                      </span>
                    </div>
                  )}
                  {recargosDelDia.HEN > 0 && (
                    <div className="flex justify-between text-xs bg-blue-100 px-2 py-1 rounded">
                      <span className="text-blue-700 font-medium">HEN:</span>
                      <span className="text-blue-800 font-bold">
                        {formatearHoras(recargosDelDia.HEN)}h
                      </span>
                    </div>
                  )}
                  {recargosDelDia.RN > 0 && (
                    <div className="flex justify-between text-xs bg-purple-100 px-2 py-1 rounded">
                      <span className="text-purple-700 font-medium">RN:</span>
                      <span className="text-purple-800 font-bold">
                        {formatearHoras(recargosDelDia.RN)}h
                      </span>
                    </div>
                  )}
                  {recargosDelDia.RD > 0 && (
                    <div className="flex justify-between text-xs bg-red-100 px-2 py-1 rounded">
                      <span className="text-red-700 font-medium">RD:</span>
                      <span className="text-red-800 font-bold">
                        {formatearHoras(recargosDelDia.RD)}h
                      </span>
                    </div>
                  )}
                  {recargosDelDia.HEFD > 0 && (
                    <div className="flex justify-between text-xs bg-orange-100 px-2 py-1 rounded">
                      <span className="text-orange-700 font-medium">HEFD:</span>
                      <span className="text-orange-800 font-bold">
                        {formatearHoras(recargosDelDia.HEFD)}h
                      </span>
                    </div>
                  )}
                  {recargosDelDia.HEFN > 0 && (
                    <div className="flex justify-between text-xs bg-indigo-100 px-2 py-1 rounded">
                      <span className="text-indigo-700 font-medium">HEFN:</span>
                      <span className="text-indigo-800 font-bold">
                        {formatearHoras(recargosDelDia.HEFN)}h
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        );
      },
    );

    DiaCard.displayName = "DiaCard";

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        hideCloseButton
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[95vh]",
          body: "py-6",
          backdrop: "bg-black/60 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          {() => (
            <>
              {/* Header */}
              <ModalHeader className="flex flex-col gap-1 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Eye className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Detalle de Recargo
                      </h2>
                      {infoRecargo && (
                        <p className="text-sm text-gray-600 mt-1">
                          {infoRecargo.planilla} - {infoRecargo.mesAño}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onPress={handleClose}
                    isIconOnly
                    variant="light"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </ModalHeader>

              {/* Body */}
              <ModalBody>
                {isLoadingData && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Spinner size="lg" color="primary" />
                      <p className="text-gray-600 mt-4">
                        Cargando información del recargo...
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertCircle
                        className="mx-auto mb-4 text-red-500"
                        size={48}
                      />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Error
                      </h3>
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {recargo && infoRecargo && !isLoadingData && (
                  <div className="space-y-6">
                    {/* Información Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Conductor */}
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-gray-900">
                              Conductor
                            </h3>
                          </div>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">
                              {`${infoRecargo.conductor.apellido} ${infoRecargo.conductor.nombre}`}
                            </p>
                            <p className="text-gray-600">
                              {`CC: ${infoRecargo.conductor.numero_identificacion}`}
                            </p>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Vehículo */}
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Car size={20} className="text-green-600" />
                            <h3 className="font-semibold text-gray-900">
                              Vehículo
                            </h3>
                          </div>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <div className="space-y-2">
                            <Chip
                              color="primary"
                              variant="flat"
                              className="font-bold text-lg"
                            >
                              {infoRecargo.vehiculo.placa}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Empresa */}
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Building2 size={20} className="text-purple-600" />
                            <h3 className="font-semibold text-gray-900">
                              Empresa
                            </h3>
                          </div>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">
                              {infoRecargo.empresa.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              NIT: {infoRecargo.empresa.nit}
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Resumen de Totales */}
                    <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Timer size={20} className="text-emerald-600" />
                          <h3 className="font-semibold text-gray-900">
                            Resumen de Horas
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">
                              {formatearHoras(totales.totalHoras)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total Horas
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {infoRecargo.totalDias}
                            </div>
                            <div className="text-xs text-gray-500">Días</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {formatearHoras(totales.totalesRecargos.HED)}
                            </div>
                            <div className="text-xs text-gray-500">
                              HED (25%)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {formatearHoras(totales.totalesRecargos.HEN)}
                            </div>
                            <div className="text-xs text-gray-500">
                              HEN (75%)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {formatearHoras(totales.totalesRecargos.HEFD)}
                            </div>
                            <div className="text-xs text-gray-500">
                              HEFD (100%)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">
                              {formatearHoras(totales.totalesRecargos.HEFN)}
                            </div>
                            <div className="text-xs text-gray-500">
                              HEFN (150%)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {formatearHoras(totales.totalesRecargos.RN)}
                            </div>
                            <div className="text-xs text-gray-500">
                              RN (35%)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {formatearHoras(totales.totalesRecargos.RD)}
                            </div>
                            <div className="text-xs text-gray-500">
                              RD (75%)
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Días Laborales */}
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Calendar size={20} className="text-blue-600" />
                          <h3 className="font-semibold text-gray-900">
                            Días Laborales Detallados
                          </h3>
                          <Chip size="sm" color="primary" variant="flat">
                            {recargo.dias_laborales.length} días
                          </Chip>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {recargo.dias_laborales.map((dia, index) => (
                            <DiaCard
                              key={`dia-${dia.dia}-${index}`}
                              dia={dia}
                              index={index}
                            />
                          ))}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Información Adicional */}
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-gray-600" />
                          <h3 className="font-semibold text-gray-900">
                            Información Adicional
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">
                              ID del Recargo:
                            </span>
                            <p className="font-mono text-xs text-gray-700 break-all">
                              {recargo.id}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Período:</span>
                            <p className="text-gray-700">
                              {infoRecargo.mesAño}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>

              {/* Footer */}
              <ModalFooter className="pt-6 border-t border-gray-200">
                <Button
                  color="primary"
                  onPress={handleClose}
                  className="min-w-[100px]"
                >
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  },
);

ModalVisualizarRecargo.displayName = "ModalVisualizarRecargo";

export default ModalVisualizarRecargo;
