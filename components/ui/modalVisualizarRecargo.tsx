import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Eye,
  X,
  AlertCircle,
  FileText,
  History,
  Clock,
  User,
} from "lucide-react";
import { RecargoDetallado, useRecargo } from "@/context/RecargoPlanillaContext";
import { addToast } from "@heroui/toast";
import { apiClient } from "@/config/apiClient";

interface ModalVisualizarRecargoProps {
  recargoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

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

const ModalVisualizarRecargo = React.memo<ModalVisualizarRecargoProps>(
  ({ recargoId, isOpen, onClose }) => {
    const [recargo, setRecargo] = useState<RecargoDetallado | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mesAño, setMesAño] = useState<{ mes: number; año: number } | null>(
      null,
    );
    const [archivoExistente, setArchivoExistente] = useState<string | null>(
      null,
    );
    const [selectedTab, setSelectedTab] = useState("detalles");

    // Función para formatear fecha
    const formatearFecha = useCallback((fecha: string) => {
      return new Date(fecha).toLocaleString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }, []);

    // Función para traducir acciones
    const traducirAccion = useCallback((accion: string) => {
      const traducciones: Record<string, string> = {
        creacion: "Creación",
        actualizacion: "Actualización",
        eliminacion: "Eliminación",
        restauracion: "Restauración",
        aprobacion: "Aprobación",
        rechazo: "Rechazo",
      };
      return traducciones[accion] || accion;
    }, []);

    // Función para obtener color de acción
    const getColorAccion = useCallback((accion: string) => {
      const colores: Record<string, string> = {
        creacion: "bg-green-100 text-green-700",
        actualizacion: "bg-blue-100 text-blue-700",
        eliminacion: "bg-red-100 text-red-700",
        restauracion: "bg-purple-100 text-purple-700",
        aprobacion: "bg-emerald-100 text-emerald-700",
        rechazo: "bg-orange-100 text-orange-700",
      };
      return colores[accion] || "bg-gray-100 text-gray-700";
    }, []);

    const { obtenerRecargoPorId } = useRecargo();

    // Función para obtener URL firmada
    const getPresignedUrl = useCallback(async (s3Key: string) => {
      try {
        const response = await apiClient.get(`/api/documentos/url-firma`, {
          params: { key: s3Key },
        });
        return response.data.url;
      } catch (error) {
        console.error("Error al obtener URL firmada:", error);
        return null;
      }
    }, []);

    // Función para cargar datos del recargo
    const cargarDatosRecargo = useCallback(
      async (id: string) => {
        try {
          setIsLoadingData(true);
          setError(null);

          const response = await obtenerRecargoPorId(id);

          if (response?.success && response.data?.recargo) {
            const recargoData = response.data.recargo;

            // Cargar archivo si existe
            if (recargoData.planilla_s3key) {
              const url = await getPresignedUrl(recargoData.planilla_s3key);
              setArchivoExistente(url);
            } else {
              setArchivoExistente(null);
            }

            setRecargo(recargoData);
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
      [obtenerRecargoPorId, getPresignedUrl],
    );

    // Función para descargar archivo
    const descargarArchivoExistente = useCallback(() => {
      if (archivoExistente) {
        window.open(archivoExistente, "_blank");
      }
    }, [archivoExistente]);

    useEffect(() => {
      if (recargoId && isOpen) {
        cargarDatosRecargo(recargoId);
      }
    }, [isOpen, recargoId, cargarDatosRecargo]);

    const handleClose = useCallback(() => {
      setRecargo(null);
      setError(null);
      setMesAño(null);
      setArchivoExistente(null);
      onClose();
    }, [onClose]);

    const formatearHoras = useCallback(
      (horas: number | string | undefined): string => {
        if (!horas) return "0.0";
        const num = typeof horas === "string" ? parseFloat(horas) : horas;
        return isNaN(num) ? "0.0" : num.toFixed(1);
      },
      [],
    );

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

    const infoRecargo = useMemo(() => {
      if (!recargo || !mesAño) return null;
      return {
        conductor: recargo.conductor,
        vehiculo: recargo.vehiculo,
        empresa: recargo.empresa,
        planilla:
          recargo.numero_planilla ||
          `Planilla ${obtenerNombreMes(mesAño.mes)} ${mesAño.año}`,
        totalDias: recargo.total_dias,
        mesAño: `${obtenerNombreMes(mesAño.mes)} ${mesAño.año}`,
      };
    }, [recargo, mesAño, obtenerNombreMes]);

    const totales = useMemo(() => {
      if (!recargo?.dias_laborales?.length) {
        return {
          totalHoras: 0,
          totalesRecargos: { HED: 0, HEN: 0, HEFD: 0, HEFN: 0, RN: 0, RD: 0 },
        };
      }

      const totalesRecargos = recargo.dias_laborales.reduce(
        (acc, dia) => ({
          HED: acc.HED + (dia.hed || 0),
          HEN: acc.HEN + (dia.hen || 0),
          HEFD: acc.HEFD + (dia.hefd || 0),
          HEFN: acc.HEFN + (dia.hefn || 0),
          RN: acc.RN + (dia.rn || 0),
          RD: acc.RD + (dia.rd || 0),
        }),
        { HED: 0, HEN: 0, HEFD: 0, HEFN: 0, RN: 0, RD: 0 },
      );

      return {
        totalHoras: recargo.total_horas || 0,
        totalesRecargos,
      };
    }, [recargo]);

    const DiaCard = React.memo(
      ({ dia }: { dia: DiaLaboral; index: number }) => {
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
          <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
            {/* Header del día */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {dia.dia}
                  </span>
                </div>
                {dia.es_especial && (
                  <span className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded-full">
                    {dia.es_domingo ? "DOM" : "FEST"}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatearHoras(dia.total_horas)}h
              </span>
            </div>

            {/* Horario */}
            <div className="text-xs text-gray-400 mb-3">
              {dia.hora_inicio}:00 - {dia.hora_fin}:00
            </div>

            {/* Recargos - Solo mostrar si existen */}
            {tieneRecargos && (
              <div className="space-y-1">
                {[
                  {
                    key: "HED",
                    color: "bg-green-50 text-green-700",
                    value: recargosDelDia.HED,
                  },
                  {
                    key: "HEN",
                    color: "bg-blue-50 text-blue-700",
                    value: recargosDelDia.HEN,
                  },
                  {
                    key: "RN",
                    color: "bg-purple-50 text-purple-700",
                    value: recargosDelDia.RN,
                  },
                  {
                    key: "RD",
                    color: "bg-red-50 text-red-700",
                    value: recargosDelDia.RD,
                  },
                  {
                    key: "HEFD",
                    color: "bg-orange-50 text-orange-700",
                    value: recargosDelDia.HEFD,
                  },
                  {
                    key: "HEFN",
                    color: "bg-indigo-50 text-indigo-700",
                    value: recargosDelDia.HEFN,
                  },
                ].map(
                  ({ key, color, value }) =>
                    value > 0 && (
                      <div
                        key={key}
                        className={`flex justify-between items-center px-2 py-1 rounded ${color} text-xs`}
                      >
                        <span>{key}:</span>
                        <span className="font-medium">
                          {formatearHoras(value)}h
                        </span>
                      </div>
                    ),
                )}
              </div>
            )}
          </div>
        );
      },
    );

    DiaCard.displayName = "DiaCard";

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        hideCloseButton
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent className="bg-white">
          {() => (
            <>
              {/* Header minimalista */}
              <ModalHeader className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">
                      Detalle de Recargo
                    </h2>
                    {infoRecargo && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {infoRecargo.mesAño}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botón de descarga de archivo */}
                    {archivoExistente && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={descargarArchivoExistente}
                        className="text-emerald-600 hover:bg-emerald-50"
                      >
                        <Eye size={16} />
                      </Button>
                    )}
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={handleClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="px-6 py-6">
                {isLoadingData && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Spinner size="md" color="primary" />
                      <p className="text-gray-500 text-sm mt-3">
                        Cargando información...
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertCircle
                        className="mx-auto mb-3 text-red-400"
                        size={32}
                      />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {recargo && infoRecargo && !isLoadingData && (
                  <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                  >
                    {/* TAB 1: DETALLES */}
                    <Tab
                      key="detalles"
                      title={
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          <span>Detalles</span>
                        </div>
                      }
                    >
                      <div className="space-y-6">
                        {/* Información Principal - Layout más limpio */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="col-span-2 space-y-1">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Conductor
                            </div>
                            <div className="font-medium text-gray-900">
                              {`${infoRecargo.conductor.apellido} ${infoRecargo.conductor.nombre}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              CC: {infoRecargo.conductor.numero_identificacion}
                            </div>
                          </div>

                          <div className="col-span-1 space-y-1">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Vehículo
                            </div>
                            <div className="font-medium text-gray-900 text-lg">
                              {infoRecargo.vehiculo.placa}
                            </div>
                          </div>

                          <div className="col-span-1 space-y-1">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Número de planilla
                            </div>
                            <div className="font-medium text-gray-900 text-lg">
                              {infoRecargo.planilla}
                            </div>
                          </div>

                          <div className="col-span-2 space-y-1">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Empresa
                            </div>
                            <div className="font-medium text-gray-900">
                              {infoRecargo.empresa.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              NIT: {infoRecargo.empresa.nit}
                            </div>
                          </div>
                        </div>

                        {/* Resumen de Totales - Más compacto */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                            Resumen de Horas
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatearHoras(totales.totalHoras)}
                              </div>
                              <div className="text-xs text-gray-400">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {infoRecargo.totalDias}
                              </div>
                              <div className="text-xs text-gray-400">Días</div>
                            </div>
                            {[
                              {
                                key: "HED",
                                value: totales.totalesRecargos.HED,
                                label: "HED",
                                percent: "25%",
                              },
                              {
                                key: "HEN",
                                value: totales.totalesRecargos.HEN,
                                label: "HEN",
                                percent: "75%",
                              },
                              {
                                key: "HEFD",
                                value: totales.totalesRecargos.HEFD,
                                label: "HEFD",
                                percent: "100%",
                              },
                              {
                                key: "HEFN",
                                value: totales.totalesRecargos.HEFN,
                                label: "HEFN",
                                percent: "150%",
                              },
                              {
                                key: "RN",
                                value: totales.totalesRecargos.RN,
                                label: "RN",
                                percent: "35%",
                              },
                              {
                                key: "RD",
                                value: totales.totalesRecargos.RD,
                                label: "RD",
                                percent: "75%",
                              },
                            ].map(({ key, value, label, percent }) => (
                              <div key={key} className="text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatearHoras(value)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {label}
                                </div>
                                <div className="text-xs text-gray-300">
                                  ({percent})
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Días Laborales - Grid más compacto */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Días Laborales
                            </div>
                            <span className="text-xs text-gray-400">
                              {recargo.dias_laborales.length} días registrados
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {recargo.dias_laborales.map((dia, index) => (
                              <DiaCard
                                key={`dia-${dia.dia}-${index}`}
                                dia={dia}
                                index={index}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Información Adicional */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                            Información del Sistema
                          </div>
                          <div className="text-xs text-gray-500 font-mono break-all">
                            ID: {recargo.id}
                          </div>
                        </div>
                      </div>
                    </Tab>
                    {/* TAB 2: AUDITORÍA */}
                    <Tab
                      key="auditoria"
                      title={
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>Auditoría</span>
                        </div>
                      }
                    >
                      <div className="space-y-6 mt-4">
                        {/* Información de Creación */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                              <User size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Creación del Recargo
                              </h3>
                              <p className="text-xs text-gray-500">
                                Versión {recargo.version}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Creado por
                              </div>
                              <div className="font-medium text-gray-900">
                                {recargo.auditoria.creado_por?.nombre ||
                                  "Sistema"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {recargo.auditoria.creado_por?.correo || "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Fecha de creación
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-900">
                                <Clock size={14} className="text-gray-400" />
                                {formatearFecha(
                                  recargo.auditoria.fecha_creacion,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Información de Última Actualización */}
                        {recargo.auditoria.actualizado_por && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Clock size={20} className="text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Última Actualización
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Versión actual: {recargo.version}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Actualizado por
                                </div>
                                <div className="font-medium text-gray-900">
                                  {recargo.auditoria.actualizado_por.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {recargo.auditoria.actualizado_por.correo}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Fecha de actualización
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <Clock size={14} className="text-gray-400" />
                                  {formatearFecha(
                                    recargo.auditoria.fecha_actualizacion,
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Información Adicional */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                Estado
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                                {recargo.estado}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                Versión
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                v{recargo.version}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                ID del Sistema
                              </div>
                              <div className="text-xs text-gray-500 font-mono break-all">
                                {recargo.id}
                              </div>
                            </div>
                          </div>

                          {recargo.observaciones && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                                Observaciones
                              </div>
                              <div className="text-sm text-gray-700">
                                {recargo.observaciones}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Tab>

                    {/* TAB 3: HISTORIAL */}
                    <Tab
                      key="historial"
                      title={
                        <div className="flex items-center gap-2">
                          <History size={16} />
                          <span>Historial</span>
                          {recargo.historial.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              {recargo.historial.length}
                            </span>
                          )}
                        </div>
                      }
                    >
                      <div className="mt-4">
                        {recargo.historial.length === 0 ? (
                          <div className="text-center py-12">
                            <History
                              size={48}
                              className="mx-auto mb-4 text-gray-300"
                            />
                            <p className="text-gray-500 text-sm">
                              No hay cambios registrados en el historial
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {recargo.historial
                              .slice()
                              .sort(
                                (a, b) =>
                                  (b.version_nueva ?? 0) -
                                  (a.version_nueva ?? 0),
                              )
                              .map((item, index) => (
                                <div
                                  key={item.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getColorAccion(item.accion)}`}
                                      >
                                        {traducirAccion(item.accion)}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        Versión {item.version_anterior || 0} →{" "}
                                        {item.version_nueva}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      #{recargo.historial.length - index}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-xs text-gray-400 mb-1">
                                        Usuario
                                      </div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.usuario?.nombre || "Sistema"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item.usuario?.correo || "N/A"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-400 mb-1">
                                        Fecha
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <Clock
                                          size={12}
                                          className="text-gray-400"
                                        />
                                        {formatearFecha(item.fecha)}
                                      </div>
                                    </div>
                                  </div>

                                  {item.campos_modificados &&
                                    item.campos_modificados.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-xs text-gray-400 mb-2">
                                          Campos modificados
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {item.campos_modificados.map(
                                            (campo, idx) => (
                                              <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                              >
                                                {campo}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {item.motivo && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <div className="text-xs text-gray-400 mb-1">
                                        Motivo
                                      </div>
                                      <div className="text-sm text-gray-700 italic">
                                        &quot;{item.motivo}&quot;
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                )}
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-gray-100">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleClose}
                  size="sm"
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
