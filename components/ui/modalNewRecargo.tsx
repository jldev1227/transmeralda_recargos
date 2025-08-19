import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Car,
  Building2,
  FileText,
  Upload,
  X,
  Check,
  AlertCircle,
  Save,
  Users,
  Hash,
  Paperclip,
  ChevronRight,
  Info,
  ArrowRight,
  CheckCircle,
  Circle,
  PlusIcon
} from "lucide-react";
import ReactSelect, {
  CSSObjectWithLabel,
  StylesConfig,
  ControlProps,
  OptionProps,
  GroupBase,
} from "react-select";
import { Conductor, Empresa, Vehiculo } from "@/types";
import { useRecargo } from "@/context/RecargoPlanillaContext";
import { addToast } from "@heroui/toast";
import TablaConRecargos from "./tableRecargos";
import UploadPlanilla from "../uploadPlanilla";

interface DiaLaboral {
  id: string;
  dia: string;
  mes: string;
  año: string;
  horaInicio: string;
  horaFin: string;
}

interface Option {
  value: string;
  label: string;
  description?: string;
}

// Estilos mejorados para react-select
const customStyles: StylesConfig<Option, false, GroupBase<Option>> = {
  control: (
    provided: CSSObjectWithLabel,
    state: ControlProps<Option, false, GroupBase<Option>>,
  ) => ({
    ...provided,
    minHeight: "52px",
    borderColor: state.isFocused ? "#0070f3" : "#e5e7eb",
    borderWidth: "2px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 112, 243, 0.1)" : "none",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: state.isFocused ? "#0070f3" : "#9ca3af",
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
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
  clearIndicator: (provided: CSSObjectWithLabel) => ({
    ...provided,
    cursor: "pointer",
    color: "#6b7280",
    "&:hover": {
      color: "#374151",
    },
  }),
  dropdownIndicator: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "#6b7280",
    "&:hover": {
      color: "#374151",
    },
  }),
};

// Componente de label mejorado
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
      <div className="w-5 h-5 flex items-center justify-center text-blue-600">
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

// Componente para opción de empresa mejorado
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

// Componente de progreso del formulario
const FormProgress = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">Progreso del formulario</span>
      <span className="text-sm text-gray-500">{currentStep}/{totalSteps}</span>
    </div>
    <Progress
      value={(currentStep / totalSteps) * 100}
      color="primary"
      className="h-2"
      classNames={{
        track: "bg-gray-200",
        indicator: "bg-gradient-to-r from-blue-500 to-indigo-600"
      }}
    />
  </div>
);

// Componente de indicador de tab completado
const TabIndicator = ({ completed }: { completed: boolean }) => (
  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completed ? 'bg-green-500 text-white' : 'bg-gray-300'
    }`}>
    {completed ? <Check size={12} /> : <Circle size={12} className="text-gray-500" />}
  </div>
);

export default function ModalNewRecargo({
  currentMonth,
  currentYear,
}: {
  currentMonth: number;
  currentYear: number;
}) {
  const { conductores, vehiculos, empresas, registrarRecargo } = useRecargo();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("informacion");

  const [formData, setFormData] = useState({
    conductorId: "",
    vehiculoId: "",
    empresaId: "",
    tmNumber: "",
  });

  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);

  const [diasLaborales, setDiasLaborales] = useState<DiaLaboral[]>([
    {
      id: "1",
      dia: "",
      mes: "",
      año: new Date().getFullYear().toString(),
      horaInicio: "",
      horaFin: "",
    },
  ]);

  // Cálculo del progreso del formulario
  const calculateProgress = () => {
    let completed = 0;
    const total = 4; // conductor, vehiculo, empresa, dias laborales

    if (formData.conductorId) completed++;
    if (formData.vehiculoId) completed++;
    if (formData.empresaId) completed++;
    if (diasLaborales.some(dia => dia.dia && dia.horaInicio && dia.horaFin)) completed++;

    return { completed, total };
  };

  const progress = calculateProgress();

  // Verificar si cada tab está completado
  const tabCompleted = {
    informacion: formData.conductorId && formData.vehiculoId && formData.empresaId,
    horarios: diasLaborales.some(dia => dia.dia && dia.horaInicio && dia.horaFin),
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        conductorId: "",
        vehiculoId: "",
        empresaId: "",
        tmNumber: "",
      });
      setArchivoAdjunto(null);
      setDiasLaborales([
        {
          id: "1",
          dia: "",
          mes: "",
          año: new Date().getFullYear().toString(),
          horaInicio: "",
          horaFin: "",
        },
      ]);
      setIsLoading(false);
      setActiveTab("informacion");
    }
  }, [isOpen]);

  // Transformar datos para react-select
  const conductorOptions = conductores.map((conductor: Conductor) => ({
    value: conductor.id.toString(),
    label: `${conductor.nombre} ${conductor.apellido}`,
    description: `CC: ${conductor.numero_identificacion}`,
  }));

  const vehiculoOptions = vehiculos.map((vehiculo: Vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculo.placa,
    description: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.año}`,
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
        horaInicio: "",
        horaFin: "",
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
  };

  const handleContinueToSchedule = () => {
    if (!tabCompleted.informacion) {
      addToast({
        title: "Información incompleta",
        description: "Complete conductor, vehículo y empresa antes de continuar.",
        color: "warning",
      });
      return;
    }
    setActiveTab("horarios");
  };

  const handleSubmit = async () => {
    // Validaciones
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

    if (diasLaborales.some((dia) => !dia.dia || !dia.horaInicio || !dia.horaFin)) {
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

      formDataToSend.append('recargo_data', JSON.stringify({
        conductor_id: formData.conductorId,
        vehiculo_id: formData.vehiculoId,
        empresa_id: formData.empresaId,
        numero_planilla: formData.tmNumber,
        mes: currentMonth,
        año: currentYear,
        dias_laborales: diasLaborales.map((dia) => ({
          dia: dia.dia,
          horaInicio: dia.horaInicio,
          horaFin: dia.horaFin,
        })),
      }));

      // Adjuntar archivo solo si existe (ahora es opcional)
      if (archivoAdjunto) {
        formDataToSend.append('planilla', archivoAdjunto);
      }

      await registrarRecargo(formDataToSend);

      addToast({
        title: "Recargo registrado",
        description: "El recargo se ha registrado exitosamente.",
        color: "success",
      });

    } catch (error) {
      addToast({
        title: "Error al registrar",
        description: "Ocurrió un error al registrar el recargo. Intente nuevamente.",
        color: "danger",
      });
      console.error("Error al registrar recargo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onPress={onOpen} color="success" variant="flat" radius="sm" startContent={<PlusIcon className="w-5 h-5" />}>Nuevo recargo</Button>
      <Modal
        isOpen={isOpen}
        size="5xl"
        scrollBehavior="inside"
        isDismissable={!isLoading}
        hideCloseButton={isLoading}
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Nuevo Recargo Laboral
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][currentMonth - 1]} {currentYear}
                      </p>
                    </div>
                  </div>
                  {!isLoading && (
                    <Button
                      isIconOnly
                      variant="light"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>

                {/* Progreso del formulario */}
                <div className="mt-4">
                  <FormProgress currentStep={progress.completed} totalSteps={progress.total} />
                </div>
              </ModalHeader>

              <ModalBody>
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  color="primary"
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-blue-500",
                    tab: "max-w-fit px-4 h-12",
                    tabContent: "group-data-[selected=true]:text-blue-600"
                  }}
                >
                  <Tab
                    key="informacion"
                    title={
                      <div className="flex items-center gap-3">
                        <TabIndicator completed={tabCompleted.informacion} />
                        <div className="flex items-center gap-2">
                          <Users size={18} />
                          <span className="font-medium">Información Principal</span>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-6 py-4">
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
                            value={conductorOptions.find(option => option.value === formData.conductorId) || null}
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                conductorId: selectedOption ? selectedOption.value : "",
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
                            value={vehiculoOptions.find(option => option.value === formData.vehiculoId) || null}
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                vehiculoId: selectedOption ? selectedOption.value : "",
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
                            value={empresaOptions.find(option => option.value === formData.empresaId) || null}
                            onChange={(selectedOption) => {
                              setFormData({
                                ...formData,
                                empresaId: selectedOption ? selectedOption.value : "",
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
                              inputWrapper: "h-[52px] border-2 border-gray-200 hover:border-gray-300 focus-within:border-blue-500",
                              input: "text-sm"
                            }}
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-gray-500 text-sm font-medium">TM-</span>
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
                          <UploadPlanilla
                            onFileChange={handleFileChange}
                            maxSizeMB={15}
                          />
                          {archivoAdjunto && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <FileText size={16} className="text-green-600" />
                              <span className="text-sm font-medium text-green-800 flex-1">
                                {archivoAdjunto.name}
                              </span>
                              <span className="text-xs text-green-600">
                                {(archivoAdjunto.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-green-600 hover:text-green-800"
                                onPress={() => setArchivoAdjunto(null)}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón para continuar */}
                      <div className="flex justify-end pt-4">
                        <Button
                          color="primary"
                          onPress={handleContinueToSchedule}
                          endContent={<ArrowRight size={16} />}
                          isDisabled={!tabCompleted.informacion}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600"
                        >
                          Continuar a Horarios
                        </Button>
                      </div>
                    </div>
                  </Tab>

                  <Tab
                    key="horarios"
                    title={
                      <div className="flex items-center gap-3">
                        <TabIndicator completed={tabCompleted.horarios} />
                        <div className="flex items-center gap-2">
                          <Clock size={18} />
                          <span className="font-medium">Horarios de Trabajo</span>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-6 py-4">
                      {/* Información de alerta */}
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800 mb-1">
                            Configuración de Horarios
                          </h4>
                          <p className="text-sm text-amber-700">
                            Configure los días y horarios laborales para el cálculo automático de recargos.
                            El sistema calculará HED, HEN, y recargos dominicales/festivos según la normativa vigente.
                          </p>
                        </div>
                      </div>

                      {/* Controles de días laborales */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={20} className="text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Días Laborales</h3>
                          <span className="text-red-500">*</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={diasLaborales.length >= 10 ? "warning" : "primary"}
                            className="text-xs"
                          >
                            {diasLaborales.length}/15 días
                          </Chip>
                          <Button
                            size="sm"
                            color="primary"
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
                          />
                        </CardBody>
                      </Card>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>

              <ModalFooter className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${progress.completed === progress.total ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {progress.completed === progress.total ? 'Formulario completo' : `${progress.total - progress.completed} campos pendientes`}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      color="danger"
                      variant="light"
                      isDisabled={isLoading}
                      className="min-w-[100px]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleSubmit}
                      isLoading={isLoading}
                      startContent={!isLoading && <Save size={16} />}
                      isDisabled={!tabCompleted.informacion || !tabCompleted.horarios}
                      className="min-w-[140px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {isLoading ? "Registrando..." : "Registrar Recargo"}
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