import React, { useEffect, useState } from "react";
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
import { Chip } from "@heroui/chip";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Car,
  Building2,
  FileText,
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

interface DiaLaboral {
  id: string;
  dia: string;
  mes: string;
  año: string;
  horaInicio: string;
  horaFin: string;
}

// Definición de tipos para react-select
interface Option {
  value: string;
  label: string;
  description?: string; // Descripción opcional para empresas
}

// Estilos personalizados para react-select - TIPADO CORRECTAMENTE
const customStyles: StylesConfig<Option, false, GroupBase<Option>> = {
  control: (
    provided: CSSObjectWithLabel,
    state: ControlProps<Option, false, GroupBase<Option>>,
  ) => ({
    ...provided,
    minHeight: "56px",
    borderColor: state.isFocused ? "#006FEE" : "#e4e4e7",
    borderWidth: "2px",
    boxShadow: state.isFocused ? "0 0 0 1px #006FEE" : "none",
    borderRadius: "12px",
    backgroundColor: "#f4f4f5",
    "&:hover": {
      borderColor: state.isFocused ? "#006FEE" : "#a1a1aa",
    },
  }),
  placeholder: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "#71717a",
  }),
  singleValue: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "#18181b",
  }),
  menu: (provided: CSSObjectWithLabel) => ({
    ...provided,
    borderRadius: "12px",
    border: "1px solid #e4e4e7",
  }),
  option: (
    provided: CSSObjectWithLabel,
    state: OptionProps<Option, false, GroupBase<Option>>,
  ) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f1f5f9" : "white",
    color: "#18181b",
    cursor: "pointer",
  }),
  clearIndicator: (provided: CSSObjectWithLabel) => ({
    ...provided,
    cursor: "pointer",
  }),
};

// Componente de label personalizado
const CustomLabel = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
    {icon}
    {children}
  </div>
);

// Componente personalizado para mostrar descripción en empresa
const EmpresaOption = ({
  data,
  ...props
}: {
  data: {
    value: string;
    label: string;
    description?: string; // Descripción opcional
  };
  innerProps: any;
  innerRef: React.Ref<HTMLDivElement>;
}) => (
  <div
    ref={props.innerRef}
    {...props.innerProps}
    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
  >
    <div className="font-medium">{data.label}</div>
    {data.description && (
      <div className="text-sm text-gray-500">{data.description}</div>
    )}
  </div>
);

export default function ModalNewRecargo({
  isOpen,
  onClose,
  currentMonth,
  currentYear,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number;
  currentYear: number;
}) {
  const { conductores, vehiculos, empresas, registrarRecargo } = useRecargo();

  const [formData, setFormData] = useState({
    conductorId: "",
    vehiculoId: "",
    empresaId: "",
    tmNumber: "",
  });

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

  // Transformar datos para react-select
  const conductorOptions = conductores.map((conductor: Conductor) => ({
    value: conductor.id.toString(),
    label: `${conductor.nombre} ${conductor.apellido}`,
  }));

  const vehiculoOptions = vehiculos.map((vehiculo: Vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculo.placa,
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

  const handleSubmit = async () => {
    // Validar que todos los campos estén completos
    if (
      !formData.conductorId ||
      !formData.vehiculoId ||
      !formData.empresaId
    ) {
      addToast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        color: "danger",
      });
      return;
    }
    if (diasLaborales.length === 0) {
      addToast({
        title: "Error",
        description: "Debe agregar al menos un día laboral.",
        color: "danger",
      });
      return;
    }
    if (
      diasLaborales.some((dia) => !dia.dia || !dia.horaInicio || !dia.horaFin)
    ) {
      addToast({
        title: "Error",
        description: "Por favor, complete todos los días laborales.",
        color: "danger",
      });
      return;
    }
    // Preparar los datos del recargo
    const recargoData = {
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
    };
    await registrarRecargo(recargoData);
    // onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      onClose={onClose}
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[95vh] max-w-7xl",
        body: "py-6",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={24} />
                <span className="text-xl font-bold">
                  Registrar Nuevo Recargo
                </span>
              </div>
              <p className="text-sm text-default-500 font-normal">
                Complete la información del conductor, vehículo, empresa y días
                laborales
              </p>
            </ModalHeader>

            <ModalBody>
              <div>
                {/* Información Principal */}
                <Card className="mb-6">
                  <CardBody className="gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User size={20} className="text-primary" />
                      Información Principal
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Select de Conductor con ReactSelect */}
                      <div className="space-y-4">
                        <CustomLabel icon={<User size={18} />}>
                          Conductor
                        </CustomLabel>
                        <ReactSelect
                          options={conductorOptions}
                          value={
                            conductorOptions.find(
                              (option: Option) =>
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
                          placeholder="Seleccione un conductor"
                          isSearchable={true}
                          isClearable={true}
                          styles={customStyles}
                          noOptionsMessage={({ inputValue }) =>
                            inputValue
                              ? `No se encontraron conductores con "${inputValue}"`
                              : "No hay conductores disponibles"
                          }
                        />

                        {/* Select de Vehículo con ReactSelect */}
                        <CustomLabel icon={<Car size={18} />}>
                          Vehículo
                        </CustomLabel>
                        <ReactSelect
                          options={vehiculoOptions}
                          value={
                            vehiculoOptions.find(
                              (option) => option.value === formData.vehiculoId,
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
                          placeholder="Seleccione un vehículo"
                          isSearchable={true}
                          isClearable={true}
                          styles={customStyles}
                          noOptionsMessage={({ inputValue }) =>
                            inputValue
                              ? `No se encontraron vehículos con "${inputValue}"`
                              : "No hay vehículos disponibles"
                          }
                        />
                      </div>

                      <div className="space-y-4">
                        {/* Select de Empresa con ReactSelect */}
                        <CustomLabel icon={<Building2 size={18} />}>
                          Empresa
                        </CustomLabel>
                        <ReactSelect
                          options={empresaOptions}
                          value={
                            empresaOptions.find(
                              (option: Option) =>
                                option.value === formData.empresaId,
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
                          placeholder="Seleccione una empresa"
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

                        <CustomLabel icon={<FileText size={18} />}>
                          Número de Planilla
                        </CustomLabel>
                        <Input
                          variant="faded"
                          type="number"
                          placeholder="0000"
                          classNames={{
                            inputWrapper: "h-16",
                          }}
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-500 text-small">
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
                  </CardBody>
                </Card>

                {/* Días Laborales */}
                <Card>
                  <CardBody className="gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar size={20} className="text-primary" />
                        Días Laborales
                      </h3>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" color="primary">
                          {diasLaborales.length}/15 días
                        </Chip>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<Plus size={16} />}
                          onPress={agregarDiaLaboral}
                          isDisabled={diasLaborales.length >= 15}
                        >
                          Agregar Día
                        </Button>
                      </div>
                    </div>

                    <TablaConRecargos
                      diasLaborales={diasLaborales}
                      setDiasLaborales={setDiasLaborales}
                      eliminarDiaLaboral={eliminarDiaLaboral}
                      actualizarDiaLaboral={actualizarDiaLaboral}
                      currentMonth={currentMonth}
                      currentYear={currentYear}
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </CardBody>
                </Card>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                Registrar Recargo
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
