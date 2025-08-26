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
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
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
  Edit3,
  Save,
  X,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { useRecargo } from "@/context/RecargoPlanillaContext";

interface TipoRecargoFormData {
  nombre: string;
  descripcion: string;
  codigo: string;
  porcentaje: number;
  valor_fijo: string;
  es_valor_fijo: boolean;
  orden_calculo: number;
  categoria: string;
  es_hora_extra: boolean;
  aplica_festivos: boolean;
  aplica_domingos: boolean;
  aplica_nocturno: boolean;
  aplica_diurno: boolean;
  vigencia_desde: string;
  vigencia_hasta: string;
  activo: boolean;
}

interface ConfiguracionSalarioFormData {
  salario_basico: string;
  valor_hora_trabajador: string;
  horas_mensuales_base: number;
  vigencia_desde: string;
  observaciones: string;
  activo: boolean;
  empresa_id?: number;
}

// ===== COMPONENTE TAB PERSONALIZADO =====
interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isActive: boolean;
  onClick: (id: string) => void;
}

const CustomTab: React.FC<TabProps> = ({
  id,
  label,
  icon,
  count,
  isActive,
  onClick
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative flex items-center gap-2 px-4 py-3 font-medium text-sm
        transition-all duration-200 border-b-2 hover:bg-gray-50 flex-1
        ${isActive
          ? 'text-blue-600 border-blue-500 bg-blue-50/50'
          : 'text-gray-600 border-transparent hover:text-gray-800'
        } cursor-pointer
      `}
    >
      <span className={`
        ${isActive ? 'text-blue-600' : 'text-gray-500'}
      `}>
        {icon}
      </span>
      <span>{label}</span>
      {count !== undefined && (
        <span className={`
          inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
          ${isActive
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
};

// ===== COMPONENTE TABS CONTAINER =====
interface TabsContainerProps {
  children: React.ReactNode;
}

const TabsContainer: React.FC<TabsContainerProps> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="flex border-b border-gray-200 bg-white">
        {children}
      </div>
    </div>
  );
};

// ===== COMPONENTE TAB CONTENT =====
interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ children, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="py-6 animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
};

// ===== COMPONENTE CHIP PERSONALIZADO =====
interface ChipProps {
  children: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'default';
  variant?: 'flat' | 'bordered' | 'solid';
  size?: 'sm' | 'md';
}

const Chip: React.FC<ChipProps> = ({
  children,
  color = 'default',
  variant = 'flat',
  size = 'sm'
}) => {
  const getColorClasses = () => {
    const colorMap = {
      primary: variant === 'flat'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : variant === 'bordered'
          ? 'border-blue-500 text-blue-600 bg-transparent'
          : 'bg-blue-600 text-white',
      success: variant === 'flat'
        ? 'bg-green-100 text-green-800 border-green-200'
        : variant === 'bordered'
          ? 'border-green-500 text-green-600 bg-transparent'
          : 'bg-green-600 text-white',
      warning: variant === 'flat'
        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
        : variant === 'bordered'
          ? 'border-yellow-500 text-yellow-600 bg-transparent'
          : 'bg-yellow-600 text-white',
      danger: variant === 'flat'
        ? 'bg-red-100 text-red-800 border-red-200'
        : variant === 'bordered'
          ? 'border-red-500 text-red-600 bg-transparent'
          : 'bg-red-600 text-white',
      secondary: variant === 'flat'
        ? 'bg-purple-100 text-purple-800 border-purple-200'
        : variant === 'bordered'
          ? 'border-purple-500 text-purple-600 bg-transparent'
          : 'bg-purple-600 text-white',
      default: variant === 'flat'
        ? 'bg-gray-100 text-gray-800 border-gray-200'
        : variant === 'bordered'
          ? 'border-gray-300 text-gray-600 bg-transparent'
          : 'bg-gray-600 text-white'
    };
    return colorMap[color];
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border
      ${getColorClasses()}
      ${sizeClasses[size]}
    `}>
      {children}
    </span>
  );
};

export default function ModalConfiguracion() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedTab, setSelectedTab] = useState<string>("tipos-recargo");

  // Estados para edición
  const [editingTipoRecargo, setEditingTipoRecargo] = useState<number | null>(null);
  const [editingConfigSalario, setEditingConfigSalario] = useState<number | null>(null);
  const [showNewTipoRecargo, setShowNewTipoRecargo] = useState(false);
  const [showNewConfigSalario, setShowNewConfigSalario] = useState(false);

  // Formularios
  const [tipoRecargoForm, setTipoRecargoForm] = useState<TipoRecargoFormData>({
    nombre: "",
    descripcion: "",
    codigo: "",
    porcentaje: 0,
    valor_fijo: "0",
    es_valor_fijo: false,
    orden_calculo: 1,
    categoria: "RECARGO",
    es_hora_extra: false,
    aplica_festivos: false,
    aplica_domingos: false,
    aplica_nocturno: false,
    aplica_diurno: true,
    vigencia_desde: new Date().toISOString().split("T")[0],
    vigencia_hasta: "",
    activo: true,
  });

  const [configSalarioForm, setConfigSalarioForm] =
    useState<ConfiguracionSalarioFormData>({
      salario_basico: "",
      valor_hora_trabajador: "",
      horas_mensuales_base: 240,
      vigencia_desde: new Date().toISOString().split("T")[0],
      observaciones: "",
      activo: true,
    });

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

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      refrescarTiposRecargo();
      refrescarConfiguracionesSalario();
    }
  }, [isOpen]);

  // Funciones para manejar edición de tipos de recargo
  const handleEditTipoRecargo = (tipo: any) => {
    setEditingTipoRecargo(tipo.id);
    setTipoRecargoForm({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      codigo: tipo.codigo,
      porcentaje: tipo.porcentaje,
      valor_fijo: tipo.valor_fijo || "0",
      es_valor_fijo: tipo.es_valor_fijo,
      orden_calculo: tipo.orden_calculo,
      categoria: tipo.categoria,
      es_hora_extra: tipo.es_hora_extra,
      aplica_festivos: tipo.aplica_festivos,
      aplica_domingos: tipo.aplica_domingos,
      aplica_nocturno: tipo.aplica_nocturno,
      aplica_diurno: tipo.aplica_diurno,
      vigencia_desde: tipo.vigencia_desde.split("T")[0],
      vigencia_hasta: tipo.vigencia_hasta
        ? tipo.vigencia_hasta.split("T")[0]
        : "",
      activo: tipo.activo,
    });
  };

  const handleSaveTipoRecargo = async () => {
    try {
      if (editingTipoRecargo) {
        // await actualizarTipoRecargo(editingTipoRecargo, tipoRecargoForm);
      } else {
        // await crearTipoRecargo(tipoRecargoForm);
      }
      setEditingTipoRecargo(null);
      setShowNewTipoRecargo(false);
      refrescarTiposRecargo();
    } catch (error) {
      console.error("Error al guardar tipo de recargo:", error);
    }
  };

  const handleCancelEditTipoRecargo = () => {
    setEditingTipoRecargo(null);
    setShowNewTipoRecargo(false);
    setTipoRecargoForm({
      nombre: "",
      descripcion: "",
      codigo: "",
      porcentaje: 0,
      valor_fijo: "0",
      es_valor_fijo: false,
      orden_calculo: 1,
      categoria: "RECARGO",
      es_hora_extra: false,
      aplica_festivos: false,
      aplica_domingos: false,
      aplica_nocturno: false,
      aplica_diurno: true,
      vigencia_desde: new Date().toISOString().split("T")[0],
      vigencia_hasta: "",
      activo: true,
    });
  };

  // Funciones para manejar edición de configuraciones salariales
  const handleEditConfigSalario = (config: any) => {
    setEditingConfigSalario(config.id);
    setConfigSalarioForm({
      salario_basico: config.salario_basico,
      valor_hora_trabajador: config.valor_hora_trabajador,
      horas_mensuales_base: config.horas_mensuales_base,
      vigencia_desde: config.vigencia_desde.split("T")[0],
      observaciones: config.observaciones || "",
      activo: config.activo,
      empresa_id: config.empresa?.id,
    });
  };

  const handleSaveConfigSalario = async () => {
    try {
      if (editingConfigSalario) {
        // await actualizarConfiguracionSalario(editingConfigSalario, configSalarioForm);
      } else {
        // await crearConfiguracionSalario(configSalarioForm);
      }
      setEditingConfigSalario(null);
      setShowNewConfigSalario(false);
      refrescarConfiguracionesSalario();
    } catch (error) {
      console.error("Error al guardar configuración de salario:", error);
    }
  };

  const handleCancelEditConfigSalario = () => {
    setEditingConfigSalario(null);
    setShowNewConfigSalario(false);
    setConfigSalarioForm({
      salario_basico: "",
      valor_hora_trabajador: "",
      horas_mensuales_base: 240,
      vigencia_desde: new Date().toISOString().split("T")[0],
      observaciones: "",
      activo: true,
    });
  };

  // Formulario de edición para tipo de recargo
  const renderTipoRecargoForm = () => (
    <Card className="border-2 border-blue-500 bg-blue-50/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <span className="text-medium font-semibold">
            {editingTipoRecargo
              ? "Editar Tipo de Recargo"
              : "Nuevo Tipo de Recargo"}
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            placeholder="Nombre del tipo de recargo"
            value={tipoRecargoForm.nombre}
            onChange={(e) =>
              setTipoRecargoForm({ ...tipoRecargoForm, nombre: e.target.value })
            }
          />
          <Input
            label="Código"
            placeholder="Código único"
            value={tipoRecargoForm.codigo}
            onChange={(e) =>
              setTipoRecargoForm({ ...tipoRecargoForm, codigo: e.target.value })
            }
          />
        </div>

        <Textarea
          label="Descripción"
          placeholder="Descripción del tipo de recargo"
          value={tipoRecargoForm.descripcion}
          onChange={(e) =>
            setTipoRecargoForm({
              ...tipoRecargoForm,
              descripcion: e.target.value,
            })
          }
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            label="Porcentaje"
            placeholder="0"
            value={tipoRecargoForm.porcentaje.toString()}
            onChange={(e) =>
              setTipoRecargoForm({
                ...tipoRecargoForm,
                porcentaje: parseFloat(e.target.value) || 0,
              })
            }
            endContent={<Percent className="w-4 h-4" />}
          />
          <Input
            type="number"
            label="Valor Fijo"
            placeholder="0"
            value={tipoRecargoForm.valor_fijo}
            onChange={(e) =>
              setTipoRecargoForm({
                ...tipoRecargoForm,
                valor_fijo: e.target.value,
              })
            }
            endContent={<DollarSign className="w-4 h-4" />}
            isDisabled={!tipoRecargoForm.es_valor_fijo}
          />
          <Input
            type="number"
            label="Orden de Cálculo"
            placeholder="1"
            value={tipoRecargoForm.orden_calculo.toString()}
            onChange={(e) =>
              setTipoRecargoForm({
                ...tipoRecargoForm,
                orden_calculo: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Categoría"
            selectedKeys={[tipoRecargoForm.categoria]}
            onChange={(e) =>
              setTipoRecargoForm({
                ...tipoRecargoForm,
                categoria: e.target.value,
              })
            }
          >
            <SelectItem key="RECARGO">RECARGO</SelectItem>
            <SelectItem key="HORA_EXTRA">HORA EXTRA</SelectItem>
            <SelectItem key="FESTIVO">FESTIVO</SelectItem>
            <SelectItem key="NOCTURNO">NOCTURNO</SelectItem>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Vigencia Desde"
              value={tipoRecargoForm.vigencia_desde}
              onChange={(e) =>
                setTipoRecargoForm({
                  ...tipoRecargoForm,
                  vigencia_desde: e.target.value,
                })
              }
            />
            <Input
              type="date"
              label="Vigencia Hasta"
              value={tipoRecargoForm.vigencia_hasta}
              onChange={(e) =>
                setTipoRecargoForm({
                  ...tipoRecargoForm,
                  vigencia_hasta: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-small font-medium">Configuraciones:</p>
          <div className="grid grid-cols-2 gap-4">
            <Switch
              isSelected={tipoRecargoForm.es_valor_fijo}
              onValueChange={(value) =>
                setTipoRecargoForm({ ...tipoRecargoForm, es_valor_fijo: value })
              }
            >
              Es Valor Fijo
            </Switch>
            <Switch
              isSelected={tipoRecargoForm.es_hora_extra}
              onValueChange={(value) =>
                setTipoRecargoForm({ ...tipoRecargoForm, es_hora_extra: value })
              }
            >
              Es Hora Extra
            </Switch>
            <Switch
              isSelected={tipoRecargoForm.aplica_festivos}
              onValueChange={(value) =>
                setTipoRecargoForm({
                  ...tipoRecargoForm,
                  aplica_festivos: value,
                })
              }
            >
              Aplica Festivos
            </Switch>
            <Switch
              isSelected={tipoRecargoForm.aplica_domingos}
              onValueChange={(value) =>
                setTipoRecargoForm({
                  ...tipoRecargoForm,
                  aplica_domingos: value,
                })
              }
            >
              Aplica Domingos
            </Switch>
            <Switch
              isSelected={tipoRecargoForm.aplica_nocturno}
              onValueChange={(value) =>
                setTipoRecargoForm({
                  ...tipoRecargoForm,
                  aplica_nocturno: value,
                })
              }
            >
              Aplica Nocturno
            </Switch>
            <Switch
              isSelected={tipoRecargoForm.aplica_diurno}
              onValueChange={(value) =>
                setTipoRecargoForm({ ...tipoRecargoForm, aplica_diurno: value })
              }
            >
              Aplica Diurno
            </Switch>
          </div>
          <Switch
            isSelected={tipoRecargoForm.activo}
            onValueChange={(value) =>
              setTipoRecargoForm({ ...tipoRecargoForm, activo: value })
            }
          >
            Activo
          </Switch>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            color="danger"
            variant="light"
            onPress={handleCancelEditTipoRecargo}
            startContent={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            variant="flat"
            onPress={handleSaveTipoRecargo}
            startContent={<Save className="w-4 h-4" />}
          >
            Guardar
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  // Formulario de edición para configuración salarial
  const renderConfigSalarioForm = () => (
    <Card className="border-2 border-green-500 bg-green-50/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-green-600" />
          <span className="text-medium font-semibold">
            {editingConfigSalario
              ? "Editar Configuración Salarial"
              : "Nueva Configuración Salarial"}
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            label="Salario Básico"
            placeholder="0"
            value={configSalarioForm.salario_basico}
            onChange={(e) =>
              setConfigSalarioForm({
                ...configSalarioForm,
                salario_basico: e.target.value,
              })
            }
            startContent={<DollarSign className="w-4 h-4" />}
          />
          <Input
            type="number"
            label="Valor Hora"
            placeholder="0"
            value={configSalarioForm.valor_hora_trabajador}
            onChange={(e) =>
              setConfigSalarioForm({
                ...configSalarioForm,
                valor_hora_trabajador: e.target.value,
              })
            }
            startContent={<DollarSign className="w-4 h-4" />}
          />
          <Input
            type="number"
            label="Horas Mensuales Base"
            placeholder="240"
            value={configSalarioForm.horas_mensuales_base.toString()}
            onChange={(e) =>
              setConfigSalarioForm({
                ...configSalarioForm,
                horas_mensuales_base: parseInt(e.target.value) || 0,
              })
            }
            endContent={<Clock className="w-4 h-4" />}
          />
        </div>

        <Input
          type="date"
          label="Vigencia Desde"
          value={configSalarioForm.vigencia_desde}
          onChange={(e) =>
            setConfigSalarioForm({
              ...configSalarioForm,
              vigencia_desde: e.target.value,
            })
          }
        />

        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales"
          value={configSalarioForm.observaciones}
          onChange={(e) =>
            setConfigSalarioForm({
              ...configSalarioForm,
              observaciones: e.target.value,
            })
          }
        />

        <Switch
          isSelected={configSalarioForm.activo}
          onValueChange={(value) =>
            setConfigSalarioForm({ ...configSalarioForm, activo: value })
          }
        >
          Activo
        </Switch>

        <div className="flex gap-2 justify-end">
          <Button
            color="danger"
            variant="light"
            onPress={handleCancelEditConfigSalario}
            startContent={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            variant="flat"
            onPress={handleSaveConfigSalario}
            startContent={<Save className="w-4 h-4" />}
          >
            Guardar
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  // Definir tabs
  const tabs = [
    {
      id: 'tipos-recargo',
      label: 'Tipos de Recargo',
      icon: <Clock className="w-4 h-4" />,
      count: tiposRecargo.length
    },
    {
      id: 'configuracion-salario',
      label: 'Configuración Salarial',
      icon: <DollarSign className="w-4 h-4" />,
      count: configuracionesSalario.length
    }
  ];

  return (
    <>
      <Button onPress={onOpen} isIconOnly variant="flat" color="default">
        <Bolt className="text-gray-600 w-4 h-4" />
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between gap-2 px-6 py-4 border-b border-b-gray-300">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-semibold">
                    Configuración del Sistema
                  </span>
                </div>
                <Button
                  onPress={onClose}
                  isIconOnly
                  variant="light"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </Button>
              </ModalHeader>

              <ModalBody className="p-0">
                <div className="w-full px-6 pt-4">
                  {/* Tabs Header Personalizado */}
                  <TabsContainer>
                    {tabs.map((tab) => (
                      <CustomTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        count={tab.count}
                        isActive={selectedTab === tab.id}
                        onClick={setSelectedTab}
                      />
                    ))}
                  </TabsContainer>

                  {/* Tab: Tipos de Recargo */}
                  <TabContent isActive={selectedTab === 'tipos-recargo'}>
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-large font-semibold">
                            Tipos de Recargo Configurados
                          </h3>
                          <p className="text-small text-gray-500">
                            Gestiona todos los tipos de recargos y horas
                            extras disponibles
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            variant="flat"
                            startContent={<Plus className="w-4 h-4" />}
                            onPress={() => setShowNewTipoRecargo(true)}
                          >
                            Nuevo
                          </Button>
                          <Button
                            variant="flat"
                            color="default"
                            isIconOnly
                            onPress={() => refrescarTiposRecargo()}
                            isLoading={loadingTiposRecargo}
                          >
                            <RefreshCcw className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Formulario de nuevo/edición */}
                      {(showNewTipoRecargo || editingTipoRecargo) &&
                        renderTipoRecargoForm()}

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
                              className={`w-full ${tipo.activo
                                  ? "border-l-4 border-l-blue-500"
                                  : "border-l-4 border-l-gray-300"
                                } ${editingTipoRecargo?.toString() === tipo.id ? "opacity-50" : ""}`}
                            >
                              <CardBody className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <Chip
                                        color={
                                          tipo.activo ? "primary" : "default"
                                        }
                                        variant="flat"
                                      >
                                        {tipo.activo ? "Activo" : "Inactivo"}
                                      </Chip>

                                      <Chip
                                        variant="bordered"
                                        color="secondary"
                                      >
                                        {tipo.categoria}
                                      </Chip>

                                      {tipo.es_hora_extra && (
                                        <Chip
                                          size="sm"
                                          color="warning"
                                          variant="flat"
                                        >
                                          Hora Extra
                                        </Chip>
                                      )}

                                      {/* Botón de edición */}
                                      <div className="ml-auto">
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="flat"
                                          className="bg-blue-100 text-blue-600 hover:bg-blue-200"
                                          onPress={() =>
                                            handleEditTipoRecargo(tipo)
                                          }
                                          isDisabled={
                                            editingTipoRecargo?.toString() ===
                                            tipo.id
                                          }
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="mb-3">
                                      <h4 className="font-semibold text-medium">
                                        {tipo.nombre}
                                      </h4>
                                      <p className="text-small text-gray-600">
                                        {tipo.descripcion}
                                      </p>
                                      <p className="text-tiny text-gray-500 mt-1">
                                        Código: {tipo.codigo}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <Percent className="w-4 h-4 text-blue-600" />
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
                                          <DollarSign className="w-4 h-4 text-green-600" />
                                          <span className="text-tiny font-medium">
                                            Valor Fijo
                                          </span>
                                        </div>
                                        <p className="text-medium font-bold">
                                          {tipo.es_valor_fijo &&
                                            tipo.valor_fijo
                                            ? `${parseFloat(tipo.valor_fijo).toLocaleString()}`
                                            : "N/A"}
                                        </p>
                                      </div>

                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <Hash className="w-4 h-4 text-yellow-600" />
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
                                          <Calendar className="w-4 h-4 text-blue-600" />
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
                  </TabContent>

                  {/* Tab: Configuración Salarial */}
                  <TabContent isActive={selectedTab === 'configuracion-salario'}>
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-large font-semibold">
                            Configuraciones Salariales
                          </h3>
                          <p className="text-small text-gray-500">
                            Gestiona las configuraciones de salarios base y
                            valores hora
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            variant="flat"
                            startContent={<Plus className="w-4 h-4" />}
                            onPress={() => setShowNewConfigSalario(true)}
                          >
                            Nuevo
                          </Button>
                          <Button
                            variant="flat"
                            color="default"
                            isIconOnly
                            onPress={() => refrescarConfiguracionesSalario()}
                            isLoading={loadingConfigSalario}
                          >
                            <RefreshCcw className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Formulario de nuevo/edición */}
                      {(showNewConfigSalario || editingConfigSalario) &&
                        renderConfigSalarioForm()}

                      {/* Configuración vigente destacada */}
                      {configuracionSalarioVigente && (
                        <Card className="border-2 border-green-500 bg-green-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-medium font-semibold text-green-800">
                                Configuración Vigente
                              </span>
                            </div>
                          </CardHeader>
                          <CardBody className="pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="text-small font-medium text-green-700">
                                    Salario Básico
                                  </span>
                                </div>
                                <p className="text-large font-bold text-green-900 font-mono">
                                  $
                                  {parseFloat(
                                    configuracionSalarioVigente.salario_basico,
                                  ).toLocaleString()}
                                </p>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="text-small font-medium text-green-700">
                                    Valor Hora
                                  </span>
                                </div>
                                <p className="text-large font-bold text-green-900 font-mono">
                                  $
                                  {parseFloat(
                                    configuracionSalarioVigente.valor_hora_trabajador,
                                  ).toLocaleString()}
                                </p>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Hash className="w-4 h-4 text-green-600" />
                                  <span className="text-small font-medium text-green-700">
                                    Horas Mensuales
                                  </span>
                                </div>
                                <p className="text-large font-bold text-green-900">
                                  {
                                    configuracionSalarioVigente.horas_mensuales_base
                                  }
                                </p>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Building className="w-4 h-4 text-green-600" />
                                  <span className="text-small font-medium text-green-700">
                                    Alcance
                                  </span>
                                </div>
                                <p className="text-small font-medium text-green-900">
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
                          <Spinner />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {configuracionesSalario.map((config) => (
                            <Card
                              key={config.id}
                              className={`w-full ${config.activo
                                  ? "border-l-4 border-l-green-500"
                                  : "border-l-4 border-l-gray-300"
                                } ${editingConfigSalario?.toString() === config.id ? "opacity-50" : ""}`}
                            >
                              <CardBody className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <Chip
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
                                      </Chip>

                                      {config.empresa ? (
                                        <Chip
                                          variant="bordered"
                                          color="primary"
                                        >
                                          {config.empresa.nombre}
                                        </Chip>
                                      ) : (
                                        <Chip color="warning" variant="flat">
                                          Configuración Global
                                        </Chip>
                                      )}

                                      <div className="flex items-center gap-1 text-tiny text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          Desde:{" "}
                                          {new Date(
                                            config.vigencia_desde,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>

                                      {/* Botón de edición */}
                                      <div className="ml-auto">
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="flat"
                                          className="bg-green-100 text-green-600 hover:bg-green-200"
                                          onPress={() =>
                                            handleEditConfigSalario(config)
                                          }
                                          isDisabled={
                                            editingConfigSalario?.toString() ===
                                            config.id
                                          }
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                      <div>
                                        <span className="text-tiny text-gray-500">
                                          Salario Básico
                                        </span>
                                        <p className="font-mono text-medium font-semibold text-gray-900">
                                          $
                                          {parseFloat(
                                            config.salario_basico,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-tiny text-gray-500">
                                          Valor Hora
                                        </span>
                                        <p className="font-mono text-medium font-semibold text-gray-900">
                                          $
                                          {parseFloat(
                                            config.valor_hora_trabajador,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-tiny text-gray-500">
                                          Horas Mensuales
                                        </span>
                                        <p className="text-medium font-semibold text-gray-900">
                                          {config.horas_mensuales_base} horas
                                        </p>
                                      </div>
                                    </div>

                                    {config.observaciones && (
                                      <div className="bg-gray-100 rounded-lg p-3">
                                        <span className="text-tiny font-medium text-gray-700">
                                          Observaciones:
                                        </span>
                                        <p className="text-small text-gray-600 mt-1">
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
                  </TabContent>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-t-gray-300 px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-small text-gray-500">
                    {error && (
                      <div className="flex items-center gap-2 text-red-600">
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