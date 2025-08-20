import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  Bolt,
  Settings,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Calendar,
  Hash,
  Percent,
} from "lucide-react";
import { useRecargo } from "@/context/RecargoPlanillaContext";

export default function ModalConfiguracion() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedTab, setSelectedTab] = useState<string>("tipos-recargo");

  // Hook del contexto
  const {
    tiposRecargo,
    configuracionesSalario,
    configuracionSalarioVigente,
    loadingTiposRecargo,
    loadingConfigSalario,
    error,
    refrescarTiposRecargo,
    refrescarConfiguracionesSalario,
  } = useRecargo();

  console.log(tiposRecargo);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      refrescarTiposRecargo();
      refrescarConfiguracionesSalario();
    }
  }, [isOpen]);

  return (
    <>
      <Button
        onPress={onOpen}
        isIconOnly
        variant="flat"
        color="default"
        className="min-w-unit-10 w-10 h-10"
      >
        <Bolt className="text-gray-600 w-4 h-4" />
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 px-6 py-4 border-b border-b-gray-300">
                <Settings className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">
                  Configuración del Sistema
                </span>
              </ModalHeader>

              <ModalBody className="p-0">
                <div className="w-full px-6 pt-4">
                  <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    variant="underlined"
                    classNames={{
                      tabList:
                        "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                      cursor: "w-full bg-primary",
                      tab: "max-w-fit px-0 h-12",
                      tabContent: "group-data-[selected=true]:text-primary",
                    }}
                  >
                    <Tab
                      key="tipos-recargo"
                      title={
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Tipos de Recargo</span>
                          <Chip size="sm" variant="flat" color="primary">
                            {tiposRecargo.length}
                          </Chip>
                        </div>
                      }
                    >
                      <div className="py-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-large font-semibold">
                              Tipos de Recargo Configurados
                            </h3>
                            <p className="text-small text-default-500">
                              Consulta todos los tipos de recargos y horas
                              extras disponibles
                            </p>
                          </div>
                          <Button
                            variant="flat"
                            color="primary"
                            size="sm"
                            onPress={() => refrescarTiposRecargo()}
                            isLoading={loadingTiposRecargo}
                          >
                            Actualizar
                          </Button>
                        </div>

                        {/* Lista de tipos de recargo */}
                        {loadingTiposRecargo ? (
                          <div className="flex justify-center py-8">
                            <Spinner color="primary" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {tiposRecargo.map((tipo) => (
                              <Card
                                key={tipo.id}
                                className={`w-full ${
                                  tipo.activo
                                    ? "border-l-4 border-l-primary"
                                    : "border-l-4 border-l-default-300"
                                }`}
                              >
                                <CardBody className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Badge
                                          color={
                                            tipo.activo ? "primary" : "default"
                                          }
                                          variant="flat"
                                        >
                                          {tipo.activo ? "Activo" : "Inactivo"}
                                        </Badge>

                                        <Badge
                                          variant="bordered"
                                          color="secondary"
                                        >
                                          {tipo.categoria}
                                        </Badge>

                                        {tipo.es_hora_extra && (
                                          <Chip
                                            size="sm"
                                            color="warning"
                                            variant="flat"
                                          >
                                            Hora Extra
                                          </Chip>
                                        )}
                                      </div>

                                      <div className="mb-3">
                                        <h4 className="font-semibold text-medium">
                                          {tipo.nombre}
                                        </h4>
                                        <p className="text-small text-default-600">
                                          {tipo.descripcion}
                                        </p>
                                        <p className="text-tiny text-default-500 mt-1">
                                          Código: {tipo.codigo}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <Percent className="w-4 h-4 text-primary" />
                                            <span className="text-tiny font-medium">
                                              Porcentaje
                                            </span>
                                          </div>
                                          <p className="text-medium font-bold font-mono">
                                            {tipo.porcentaje}%
                                          </p>
                                        </div>

                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <DollarSign className="w-4 h-4 text-success" />
                                            <span className="text-tiny font-medium">
                                              Valor Fijo
                                            </span>
                                          </div>
                                          <p className="text-medium font-bold">
                                            {tipo.es_valor_fijo &&
                                            tipo.valor_fijo
                                              ? `$${parseFloat(tipo.valor_fijo).toLocaleString()}`
                                              : "N/A"}
                                          </p>
                                        </div>

                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <Hash className="w-4 h-4 text-warning" />
                                            <span className="text-tiny font-medium">
                                              Orden
                                            </span>
                                          </div>
                                          <p className="text-medium font-bold">
                                            {tipo.orden_calculo}
                                          </p>
                                        </div>

                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="text-tiny font-medium">
                                              Vigencia
                                            </span>
                                          </div>
                                          <p className="text-tiny">
                                            Desde:{" "}
                                            {new Date(
                                              tipo.vigencia_desde,
                                            ).toLocaleDateString()}
                                          </p>
                                          {tipo.vigencia_hasta && (
                                            <p className="text-tiny">
                                              Hasta:{" "}
                                              {new Date(
                                                tipo.vigencia_hasta,
                                              ).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Aplicabilidad */}
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {tipo.aplica_festivos && (
                                          <Chip
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                          >
                                            Festivos
                                          </Chip>
                                        )}
                                        {tipo.aplica_domingos && (
                                          <Chip
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                          >
                                            Domingos
                                          </Chip>
                                        )}
                                        {tipo.aplica_nocturno && (
                                          <Chip
                                            size="sm"
                                            variant="flat"
                                            color="secondary"
                                          >
                                            Nocturno
                                          </Chip>
                                        )}
                                        {tipo.aplica_diurno && (
                                          <Chip
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                          >
                                            Diurno
                                          </Chip>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </Tab>

                    <Tab
                      key="configuracion-salario"
                      title={
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Configuración Salarial</span>
                          <Chip size="sm" variant="flat" color="success">
                            {configuracionesSalario.length}
                          </Chip>
                        </div>
                      }
                    >
                      <div className="py-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-large font-semibold">
                              Configuraciones Salariales
                            </h3>
                            <p className="text-small text-default-500">
                              Consulta las configuraciones de salarios base y
                              valores hora
                            </p>
                          </div>
                          <Button
                            variant="flat"
                            color="success"
                            size="sm"
                            onPress={() => refrescarConfiguracionesSalario()}
                            isLoading={loadingConfigSalario}
                          >
                            Actualizar
                          </Button>
                        </div>

                        {/* Configuración vigente destacada */}
                        {configuracionSalarioVigente && (
                          <Card className="border-2 border-success bg-success-50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="text-medium font-semibold text-success-800">
                                  Configuración Vigente
                                </span>
                              </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <DollarSign className="w-4 h-4 text-success-600" />
                                    <span className="text-small font-medium text-success-700">
                                      Salario Básico
                                    </span>
                                  </div>
                                  <p className="text-large font-bold text-success-900 font-mono">
                                    $
                                    {parseFloat(
                                      configuracionSalarioVigente.salario_basico,
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Clock className="w-4 h-4 text-success-600" />
                                    <span className="text-small font-medium text-success-700">
                                      Valor Hora
                                    </span>
                                  </div>
                                  <p className="text-large font-bold text-success-900 font-mono">
                                    $
                                    {parseFloat(
                                      configuracionSalarioVigente.valor_hora_trabajador,
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Hash className="w-4 h-4 text-success-600" />
                                    <span className="text-small font-medium text-success-700">
                                      Horas Mensuales
                                    </span>
                                  </div>
                                  <p className="text-large font-bold text-success-900">
                                    {
                                      configuracionSalarioVigente.horas_mensuales_base
                                    }
                                  </p>
                                </div>

                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Building className="w-4 h-4 text-success-600" />
                                    <span className="text-small font-medium text-success-700">
                                      Alcance
                                    </span>
                                  </div>
                                  <p className="text-small font-medium text-success-900">
                                    {configuracionSalarioVigente.empresa
                                      ?.nombre || "Global"}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        )}

                        {/* Lista de configuraciones */}
                        {loadingConfigSalario ? (
                          <div className="flex justify-center py-8">
                            <Spinner color="success" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {configuracionesSalario.map((config) => (
                              <Card
                                key={config.id}
                                className={`w-full ${
                                  config.activo
                                    ? "border-l-4 border-l-success"
                                    : "border-l-4 border-l-default-300"
                                }`}
                              >
                                <CardBody className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Badge
                                          color={
                                            config.activo
                                              ? "success"
                                              : "default"
                                          }
                                          variant="flat"
                                        >
                                          {config.activo
                                            ? "Activa"
                                            : "Inactiva"}
                                        </Badge>

                                        {config.empresa ? (
                                          <Badge
                                            variant="bordered"
                                            color="primary"
                                          >
                                            {config.empresa.nombre}
                                          </Badge>
                                        ) : (
                                          <Badge color="warning" variant="flat">
                                            Configuración Global
                                          </Badge>
                                        )}

                                        <div className="flex items-center gap-1 text-tiny text-default-500">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            Desde:{" "}
                                            {new Date(
                                              config.vigencia_desde,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                          <span className="text-tiny text-default-500">
                                            Salario Básico
                                          </span>
                                          <p className="font-mono text-medium font-semibold text-default-900">
                                            $
                                            {parseFloat(
                                              config.salario_basico,
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-tiny text-default-500">
                                            Valor Hora
                                          </span>
                                          <p className="font-mono text-medium font-semibold text-default-900">
                                            $
                                            {parseFloat(
                                              config.valor_hora_trabajador,
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-tiny text-default-500">
                                            Horas Mensuales
                                          </span>
                                          <p className="text-medium font-semibold text-default-900">
                                            {config.horas_mensuales_base} horas
                                          </p>
                                        </div>
                                      </div>

                                      {config.observaciones && (
                                        <div className="bg-default-100 rounded-lg p-3">
                                          <span className="text-tiny font-medium text-default-700">
                                            Observaciones:
                                          </span>
                                          <p className="text-small text-default-600 mt-1">
                                            {config.observaciones}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                </div>
              </ModalBody>

              <ModalFooter className="border-t px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-small text-default-500">
                    {error && (
                      <div className="flex items-center gap-2 text-danger">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
