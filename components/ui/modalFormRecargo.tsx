import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Car,
  Building2,
  FileText,
  X,
  Save,
  Users,
  Hash,
  Paperclip,
  Info,
  Circle,
  Edit3,
  Download,
  RefreshCw,
  CheckCircle,
  Eye,
} from "lucide-react";
import ReactSelect, {
  CSSObjectWithLabel,
  StylesConfig,
  ControlProps,
  OptionProps,
  GroupBase,
} from "react-select";
import {
  Conductor,
  DiaLaboral,
  DiaLaboralServidor,
  Empresa,
  Vehiculo,
} from "@/types";
import { useRecargo } from "@/context/RecargoPlanillaContext";
import { addToast } from "@heroui/toast";
import TablaConRecargos from "./tableRecargos";
import UploadPlanilla from "../uploadPlanilla";
import { esDomingo } from "@/helpers";
import { apiClient } from "@/config/apiClient";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface ModalNewRecargoProps {
  currentMonth: number;
  currentYear: number;
  recargoId?: string;
  isOpen: boolean;
  onClose: () => void;
}

// ===== COMPONENTE TAB PERSONALIZADO =====
interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  onClick: (id: string) => void;
  editMode?: boolean;
}

const CustomTab: React.FC<TabProps> = ({
  id,
  label,
  icon,
  isActive,
  isCompleted,
  onClick,
  editMode = false,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative flex items-center gap-3 px-6 py-4 font-medium text-sm
        transition-all duration-200 border-b-2 hover:bg-gray-50 flex-1
        ${
          isActive
            ? editMode
              ? "text-blue-600 border-blue-500 bg-blue-50/50"
              : "text-emerald-600 border-emerald-500 bg-emerald-50/50"
            : "text-gray-600 border-transparent hover:text-gray-800"
        } cursor-pointer
      `}
    >
      {/* Indicador de completado */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <Circle size={16} className="text-gray-400" />
        )}
      </div>

      {/* Icono y label */}
      <div className="flex items-center gap-2">
        <span
          className={`
          ${
            isActive
              ? editMode
                ? "text-blue-600"
                : "text-emerald-600"
              : "text-gray-500"
          }
        `}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
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
      <div className="flex border-b border-gray-200 bg-white">{children}</div>
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
    <div className="py-4 animate-in fade-in-0 duration-200">{children}</div>
  );
};

// ===== COMPONENTE CHIP PERSONALIZADO =====
interface ChipProps {
  children: React.ReactNode;
  color?: "success" | "warning" | "danger" | "default";
  size?: "sm" | "md";
}

const Chip: React.FC<ChipProps> = ({
  children,
  color = "default",
  size = "sm",
}) => {
  const getColorClasses = () => {
    const baseClasses = {
      success: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      danger: "bg-red-100 text-red-800 border-red-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return baseClasses[color];
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`
      inline-flex items-center rounded-full font-medium border
      ${getColorClasses()}
      ${sizeClasses[size]}
    `}
    >
      {children}
    </span>
  );
};

// Estilos para react-select
const customStyles: StylesConfig<Option, false, GroupBase<Option>> = {
  control: (
    provided: CSSObjectWithLabel,
    state: ControlProps<Option, false, GroupBase<Option>>,
  ) => ({
    ...provided,
    minHeight: "52px",
    borderColor: state.isFocused ? "#10b981" : "#e5e7eb",
    borderWidth: "2px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(16, 185, 129, 0.1)" : "none",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: state.isFocused ? "#10b981" : "#9ca3af",
    },
  }),
  placeholder: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "#6b7280",
    fontSize: "14px",
  }),
  singleValue: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "#111827",
    fontSize: "14px",
    fontWeight: 500,
  }),
  menu: (provided: CSSObjectWithLabel) => ({
    ...provided,
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    zIndex: 9999,
  }),
  option: (
    provided: CSSObjectWithLabel,
    state: OptionProps<Option, false, GroupBase<Option>>,
  ) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f3f4f6" : "white",
    color: "#111827",
    cursor: "pointer",
    padding: "12px 16px",
    fontSize: "14px",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
  }),
};

// Componente de label
const FieldLabel = ({
  icon,
  children,
  required = false,
  info,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
  info?: string;
}) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <div className="w-5 h-5 flex items-center justify-center text-emerald-600">
        {icon}
      </div>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    {info && (
      <div className="group relative">
        <Info size={14} className="text-gray-400 cursor-help" />
        <div className="absolute bottom-6 left-0 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-50">
          {info}
        </div>
      </div>
    )}
  </div>
);

// Componente para opción de empresa
const EmpresaOption = ({
  data,
  ...props
}: {
  data: {
    value: string;
    label: string;
    description?: string;
  };
  innerProps: any;
  innerRef: React.Ref<HTMLDivElement>;
}) => (
  <div
    ref={props.innerRef}
    {...props.innerProps}
    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
  >
    <div className="font-medium text-gray-900">{data.label}</div>
    {data.description && (
      <div className="text-sm text-gray-500 mt-1">{data.description}</div>
    )}
  </div>
);

export default function ModalFormRecargo({
  currentMonth,
  currentYear,
  recargoId,
  isOpen,
  onClose,
}: ModalNewRecargoProps) {
  const {
    diasFestivos,
    selectedMonth,
    conductores,
    vehiculos,
    empresas,
    registrarRecargo,
    actualizarRecargo,
    obtenerRecargoPorId,
  } = useRecargo();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("informacion");
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    conductorId: "",
    vehiculoId: "",
    empresaId: "",
    tmNumber: "",
  });

  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
  const [archivoExistente, setArchivoExistente] = useState<string | null>(null);

  const [diasLaborales, setDiasLaborales] = useState<DiaLaboral[]>([
    {
      id: "1",
      dia: "",
      mes: "",
      año: new Date().getFullYear().toString(),
      hora_inicio: "",
      hora_fin: "",
      es_domingo: false,
      es_festivo: false,
    },
  ]);

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

  // Función para cargar datos del recargo a editar
  const cargarDatosRecargo = async (id: string) => {
    try {
      setIsLoadingData(true);
      const response = await obtenerRecargoPorId(id);
      const recargo = response?.data.recargo;

      if (recargo?.planilla_s3key) {
        const url = await getPresignedUrl(recargo.planilla_s3key);
        setArchivoExistente(url);
      } else {
        setArchivoExistente(null);
      }

      if (recargo) {
        setFormData({
          conductorId: recargo.conductor.id,
          vehiculoId: recargo.vehiculo.id,
          empresaId: recargo.empresa.id,
          tmNumber: recargo.planilla || "",
        });

        if (recargo.dias_laborales && recargo.dias_laborales.length > 0) {
          const diasCargados = recargo.dias_laborales.map(
            (detalle: DiaLaboralServidor) => ({
              id: detalle.id,
              dia: detalle.dia.toString(), // ✅ Convertir a string
              mes: currentMonth.toString(), // ✅ Convertir a string
              año: currentYear.toString(), // ✅ Convertir a string
              hora_inicio: detalle.hora_inicio,
              hora_fin: detalle.hora_fin,
              es_domingo: detalle.es_domingo,
              es_festivo: detalle.es_festivo,
            }),
          );

          setDiasLaborales(diasCargados);
        }

        setEditMode(true);
      }
    } catch (error) {
      console.error("Error cargando datos del recargo:", error);
      addToast({
        title: "Error",
        description: "No se pudo cargar la información del recargo",
        color: "danger",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Función para resetear el formulario
  const resetearFormulario = () => {
    setFormData({
      conductorId: "",
      vehiculoId: "",
      empresaId: "",
      tmNumber: "",
    });
    setArchivoAdjunto(null);
    setArchivoExistente(null);
    setDiasLaborales([
      {
        id: "1",
        dia: "",
        mes: "",
        año: new Date().getFullYear().toString(),
        hora_inicio: "",
        hora_fin: "",
        es_domingo: false,
        es_festivo: false,
      },
    ]);
    setIsLoading(false);
    setActiveTab("informacion");
    setEditMode(false);
  };

  useEffect(() => {
    if (recargoId && isOpen) {
      cargarDatosRecargo(recargoId);
    } else if (isOpen && !recargoId) {
      resetearFormulario();
    }
  }, [isOpen, recargoId]);

  // Cálculo del progreso del formulario
  const calculateProgress = () => {
    let completed = 0;
    const total = 4;

    if (formData.conductorId) completed++;
    if (formData.vehiculoId) completed++;
    if (formData.empresaId) completed++;
    if (diasLaborales.some((dia) => dia.dia && dia.hora_inicio && dia.hora_fin))
      completed++;

    return { completed, total };
  };

  const progress = calculateProgress();

  // Verificar si cada tab está completado
  const tabCompleted = {
    informacion:
      formData.conductorId && formData.vehiculoId && formData.empresaId
        ? true
        : false,
    horarios: diasLaborales.some(
      (dia) => dia.dia && dia.hora_inicio && dia.hora_fin,
    ),
  };

  // Transformar datos para react-select
  const conductorOptions = conductores.map((conductor: Conductor) => ({
    value: conductor.id.toString(),
    label: `${conductor.nombre} ${conductor.apellido}`,
    description: `CC: ${conductor.numero_identificacion}`,
  }));

  const vehiculoOptions = vehiculos.map((vehiculo: Vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculo.placa,
    description: `${vehiculo.marca} ${vehiculo.linea} - ${vehiculo.modelo}`,
  }));

  const empresaOptions = empresas.map((empresa: Empresa) => ({
    value: empresa.id.toString(),
    label: empresa.nombre,
    description: `NIT: ${empresa.nit}`,
  }));

  const agregarDiaLaboral = () => {
    if (diasLaborales.length < 15) {
      const nuevoDia: DiaLaboral = {
        id: Date.now().toString(),
        dia: "",
        mes: "",
        año: new Date().getFullYear().toString(),
        hora_inicio: "",
        hora_fin: "",
        es_domingo: false,
        es_festivo: false,
      };
      setDiasLaborales([...diasLaborales, nuevoDia]);
    }
  };

  const eliminarDiaLaboral = (id: string) => {
    if (diasLaborales.length > 1) {
      setDiasLaborales(diasLaborales.filter((dia) => dia.id !== id));
    }
  };

  const actualizarDiaLaboral = (
    id: string,
    campo: keyof DiaLaboral,
    valor: string,
  ) => {
    setDiasLaborales(
      diasLaborales.map((dia) =>
        dia.id === id ? { ...dia, [campo]: valor } : dia,
      ),
    );
  };

  const handleFileChange = (archivo: File | null) => {
    setArchivoAdjunto(archivo);
    if (archivo) {
      setArchivoExistente(null);
    }
  };

  const descargarArchivoExistente = () => {
    if (archivoExistente) {
      window.open(archivoExistente, "_blank");
    }
  };

  const eliminarArchivoExistente = () => {
    setArchivoExistente(null);
  };

  const handleSubmit = async () => {
    // Validaciones existentes...
    if (!formData.conductorId || !formData.vehiculoId || !formData.empresaId) {
      addToast({
        title: "Campos obligatorios",
        description: "Por favor, complete conductor, vehículo y empresa.",
        color: "danger",
      });
      setActiveTab("informacion");
      return;
    }

    if (diasLaborales.length === 0) {
      addToast({
        title: "Días laborales requeridos",
        description: "Debe agregar al menos un día laboral.",
        color: "danger",
      });
      setActiveTab("horarios");
      return;
    }

    if (
      diasLaborales.some((dia) => !dia.dia || !dia.hora_inicio || !dia.hora_fin)
    ) {
      addToast({
        title: "Información incompleta",
        description: "Complete todos los días laborales agregados.",
        color: "danger",
      });
      setActiveTab("horarios");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Función auxiliar para verificar si un día es festivo
      const verificarEsFestivo = (dia: number): boolean => {
        return diasFestivos
          .filter((f) => f.mes === currentMonth)
          .some((f) => f.dia === dia);
      };

      const recargoData = {
        conductor_id: formData.conductorId,
        vehiculo_id: formData.vehiculoId,
        empresa_id: formData.empresaId,
        numero_planilla: formData.tmNumber,
        mes: currentMonth,
        año: currentYear,
        dias_laborales: diasLaborales.map((dia) => ({
          dia: dia.dia,
          horaInicio: dia.hora_inicio,
          horaFin: dia.hora_fin,
          esDomingo: esDomingo(dia.dia, currentMonth, currentYear), // ✅ CAMPO AGREGADO COMO BOOLEAN
          esFestivo: verificarEsFestivo(parseInt(dia.dia)), // ✅ CAMPO AGREGADO COMO BOOLEAN
        })),
      };

      formDataToSend.append("recargo_data", JSON.stringify(recargoData));

      console.log(archivoAdjunto);
      if (archivoAdjunto) {
        formDataToSend.append("planilla", archivoAdjunto);
      }

      if (editMode && recargoId) {
        await actualizarRecargo(recargoId, formDataToSend);
        onClose();
      } else {
        await registrarRecargo(formDataToSend);
        onClose();
      }
    } catch (error) {
      addToast({
        title: editMode ? "Error al actualizar" : "Error al registrar",
        description: editMode
          ? "Ocurrió un error al actualizar el recargo. Intente nuevamente."
          : "Ocurrió un error al registrar el recargo. Intente nuevamente.",
        color: "danger",
      });
      console.error("Error al procesar recargo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Definir tabs
  const tabs = [
    {
      id: "informacion",
      label: "Información Principal",
      icon: <Users size={18} />,
      completed: tabCompleted.informacion,
    },
    {
      id: "horarios",
      label: "Horarios de Trabajo",
      icon: <Clock size={18} />,
      completed: tabCompleted.horarios,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      scrollBehavior="inside"
      onOpenChange={onClose}
      hideCloseButton
      classNames={{
        base: "max-h-[95vh] max-w-6xl",
        body: "py-6",
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${editMode ? "from-blue-500 to-blue-600" : "from-emerald-500 to-emerald-600"} rounded-xl flex items-center justify-center`}
                  >
                    {editMode ? (
                      <Edit3 className="text-white" size={24} />
                    ) : (
                      <FileText className="text-white" size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editMode
                        ? "Editar Recargo Laboral"
                        : "Nuevo Recargo Laboral"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {
                        [
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
                        ][currentMonth - 1]
                      }{" "}
                      {currentYear}
                      {editMode && (
                        <span className="ml-2 text-blue-600 font-medium">
                          • Modo Edición
                        </span>
                      )}
                      {/* Mostrar cantidad de festivos cargados */}
                      <span className="ml-2 text-emerald-600 font-medium">
                        •{" "}
                        {
                          diasFestivos.filter((f) => f.mes === selectedMonth)
                            .length
                        }{" "}
                        festivos detectados
                      </span>
                    </p>
                  </div>
                </div>
                {!isLoading && !isLoadingData && (
                  <Button
                    onPress={onClose}
                    isIconOnly
                    variant="light"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </Button>
                )}
              </div>
            </ModalHeader>

            <ModalBody>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw
                      className="animate-spin mx-auto mb-4 text-gray-400"
                      size={32}
                    />
                    <p className="text-gray-600">
                      Cargando información del recargo...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {/* Tabs Header Personalizado */}
                  <TabsContainer>
                    {tabs.map((tab) => (
                      <CustomTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        isActive={activeTab === tab.id}
                        isCompleted={tab.completed}
                        onClick={setActiveTab}
                        editMode={editMode}
                      />
                    ))}
                  </TabsContainer>

                  {/* Tab: Información Principal */}
                  <TabContent isActive={activeTab === "informacion"}>
                    <div className="space-y-6">
                      {/* Campos principales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Conductor */}
                        <div>
                          <FieldLabel
                            icon={<User size={16} />}
                            required
                            info="Seleccione el conductor que realizará el trabajo"
                          >
                            Conductor
                          </FieldLabel>
                          <ReactSelect
                            options={conductorOptions}
                            value={
                              conductorOptions.find(
                                (option) =>
                                  option.value === formData.conductorId,
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                conductorId: selectedOption
                                  ? selectedOption.value
                                  : "",
                              });
                            }}
                            placeholder="Buscar y seleccionar conductor..."
                            isSearchable={true}
                            isClearable={true}
                            styles={customStyles}
                            components={{ Option: EmpresaOption }}
                            noOptionsMessage={({ inputValue }) =>
                              inputValue
                                ? `No se encontraron conductores con "${inputValue}"`
                                : "No hay conductores disponibles"
                            }
                          />
                        </div>

                        {/* Vehículo */}
                        <div>
                          <FieldLabel
                            icon={<Car size={16} />}
                            required
                            info="Vehículo que utilizará el conductor"
                          >
                            Vehículo
                          </FieldLabel>
                          <ReactSelect
                            options={vehiculoOptions}
                            value={
                              vehiculoOptions.find(
                                (option) =>
                                  option.value === formData.vehiculoId,
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                vehiculoId: selectedOption
                                  ? selectedOption.value
                                  : "",
                              });
                            }}
                            placeholder="Buscar por placa..."
                            isSearchable={true}
                            isClearable={true}
                            styles={customStyles}
                            components={{ Option: EmpresaOption }}
                            noOptionsMessage={({ inputValue }) =>
                              inputValue
                                ? `No se encontraron vehículos con "${inputValue}"`
                                : "No hay vehículos disponibles"
                            }
                          />
                        </div>

                        {/* Empresa */}
                        <div>
                          <FieldLabel
                            icon={<Building2 size={16} />}
                            required
                            info="Empresa contratante del servicio"
                          >
                            Empresa
                          </FieldLabel>
                          <ReactSelect
                            options={empresaOptions}
                            value={
                              empresaOptions.find(
                                (option) => option.value === formData.empresaId,
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                empresaId: selectedOption
                                  ? selectedOption.value
                                  : "",
                              });
                            }}
                            placeholder="Buscar empresa..."
                            isSearchable={true}
                            isClearable={true}
                            styles={customStyles}
                            components={{ Option: EmpresaOption }}
                            noOptionsMessage={({ inputValue }) =>
                              inputValue
                                ? `No se encontraron empresas con "${inputValue}"`
                                : "No hay empresas disponibles"
                            }
                          />
                        </div>

                        {/* Número de planilla */}
                        <div>
                          <FieldLabel
                            icon={<Hash size={16} />}
                            info="Número de identificación de la planilla (opcional)"
                          >
                            Número de Planilla
                          </FieldLabel>
                          <Input
                            variant="bordered"
                            placeholder="Ej: 001, 002, 003..."
                            classNames={{
                              inputWrapper:
                                "h-[52px] border-2 border-gray-200 hover:border-gray-300 focus-within:border-emerald-500",
                              input: "text-sm",
                            }}
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-gray-500 text-sm font-medium">
                                  TM-
                                </span>
                              </div>
                            }
                            value={formData.tmNumber}
                            onValueChange={(value) =>
                              setFormData({ ...formData, tmNumber: value })
                            }
                          />
                        </div>
                      </div>

                      <Divider className="my-6" />

                      {/* Archivo adjunto */}
                      <div>
                        <FieldLabel
                          icon={<Paperclip size={16} />}
                          info="Adjunte la planilla de trabajo (opcional, máx. 15MB)"
                        >
                          Planilla de Trabajo
                        </FieldLabel>
                        <div className="space-y-3">
                          {editMode && archivoExistente && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <FileText
                                  size={16}
                                  className="text-emerald-600"
                                />
                                <span className="text-sm text-emerald-800 font-medium">
                                  Planilla adjunta
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={descargarArchivoExistente}
                                >
                                  <Eye size={14} className="text-emerald-600" />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  className="text-red-500"
                                  onPress={eliminarArchivoExistente}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Componente de upload */}
                          <UploadPlanilla
                            onFileChange={handleFileChange}
                            maxSizeMB={15}
                          />
                        </div>
                      </div>
                    </div>
                  </TabContent>

                  {/* Tab: Horarios de Trabajo */}
                  <TabContent isActive={activeTab === "horarios"}>
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar
                            size={24}
                            className={
                              editMode ? "text-blue-600" : "text-emerald-600"
                            }
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Días Laborales
                              <span className="text-red-500 ml-1">*</span>
                            </h3>
                            <p className="text-sm text-gray-500">
                              Registra los días y horarios trabajados
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Chip
                            size="sm"
                            color={
                              diasLaborales.length >= 10 ? "warning" : "success"
                            }
                          >
                            {diasLaborales.length}/15 días
                          </Chip>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<Plus size={16} />}
                            onPress={agregarDiaLaboral}
                            isDisabled={diasLaborales.length >= 15}
                            className="text-sm"
                          >
                            Agregar Día
                          </Button>
                        </div>
                      </div>

                      {/* Tabla de recargos */}
                      <Card className="border border-gray-200">
                        <CardBody className="p-0">
                          <TablaConRecargos
                            diasLaborales={diasLaborales}
                            actualizarDiaLaboral={actualizarDiaLaboral}
                            eliminarDiaLaboral={eliminarDiaLaboral}
                            mes={currentMonth}
                            año={currentYear}
                            diasFestivos={diasFestivos
                              .filter((f) => f.mes === currentMonth)
                              .map((f) => f.dia)}
                          />
                        </CardBody>
                      </Card>
                    </div>
                  </TabContent>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      progress.completed === progress.total
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  />
                  {progress.completed === progress.total
                    ? "Formulario completo"
                    : `${progress.total - progress.completed} campos pendientes`}
                </div>

                <div className="flex gap-3">
                  <Button
                    color="danger"
                    variant="light"
                    onPress={onClose}
                    isDisabled={isLoading || isLoadingData}
                    className="min-w-[100px]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="success"
                    variant="flat"
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    startContent={!isLoading && <Save size={16} />}
                    isDisabled={
                      !tabCompleted.informacion ||
                      !tabCompleted.horarios ||
                      isLoadingData
                    }
                  >
                    {isLoading
                      ? editMode
                        ? "Actualizando..."
                        : "Registrando..."
                      : editMode
                        ? "Actualizar Recargo"
                        : "Registrar Recargo"}
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
