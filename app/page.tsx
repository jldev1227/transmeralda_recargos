"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import {
  Building2,
  Calculator,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  Save,
  User,
  Filter,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import ModalNewRecargo from "@/components/ui/modalNewRecargo";
import DateNavigation from "@/components/ui/dateNavigation";

const PlanillaRecargos = () => {
  // Estados principales
  const [selectedCell, setSelectedCell] = useState({ row: 1, col: 1 });
  const [selectedRow, setSelectedRow] = useState(null);
  const [allMonthsData, setAllMonthsData] = useState({});
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(7);
  const [currentYear, setCurrentYear] = useState(2025);
  const [modalNewRecargo, setModalNewRecargo] = useState(false);

  // Estados para filtros
  const [filters, setFilters] = useState({
    empresa: "",
    planilla: "",
    placa: "",
    conductor: "",
  });

  const [showFilters, setShowFilters] = useState({
    empresa: false,
    planilla: false,
    placa: false,
    conductor: false,
  });

  // Constantes optimizadas
  const MONTH_NAMES = useMemo(
    () => [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ],
    [],
  );

  const COLUMN_CONFIG = {
    VER: { width: "70px", align: "center" },
    EMPRESA: { width: "280px", align: "left" },
    "No. PLANILLA": { width: "180px", align: "center" },
    PLACA: { width: "90px", align: "center" },
    CONDUCTOR: { width: "280px", align: "left" },
    DAY: { width: "55px", align: "center" },
    SUMMARY: { width: "85px", align: "right" },
  };

  const RECARGO_CONFIG = [
    { key: "HED", label: "HE Diurnas", percent: "25%", color: "emerald" },
    { key: "HEN", label: "HE Nocturnas", percent: "75%", color: "emerald" },
    { key: "HEFD", label: "HE Fest. Diurnas", percent: "100%", color: "amber" },
    {
      key: "HEFN",
      label: "HE Fest. Nocturnas",
      percent: "150%",
      color: "purple",
    },
    { key: "RN", label: "Recargo Nocturno", percent: "35%", color: "indigo" },
    {
      key: "R.D",
      label: "Rec. Dom/Fest Diurno",
      percent: "75%",
      color: "orange",
    },
    {
      key: "R.N.F",
      label: "Rec. Noct. Festivo",
      percent: "110%",
      color: "red",
    },
    { key: "D.F", label: "Días Festivos", percent: "175%", color: "pink" },
  ];

  // Estructura de columnas optimizada
  const columnHeaders = useMemo(() => {
    const baseColumns = [
      "VER",
      "EMPRESA",
      "No. PLANILLA",
      "PLACA",
      "CONDUCTOR",
    ];
    const dayColumns = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const summaryColumns = [
      "TOTAL",
      "PROMEDIO",
      ...RECARGO_CONFIG.map((r) => r.key),
    ];
    return [...baseColumns, ...dayColumns, ...summaryColumns];
  }, []);

  // Datos de ejemplo expandidos
  const sampleDataByMonth = useMemo(() => ({
    "2025-07": {
      "1-1": "M&M TRANSPORTES",
      "1-2": "TM-001",
      "1-3": "ESX808",
      "1-4": "LUIS HERNANDO HERNANDEZ",
      "1-6": "12.0",
      "1-7": "10.5",
      "1-8": "11.0",
      "1-9": "9.5",
      "1-10": "8.0",
      "1-13": "12.0",
      "1-14": "11.5",
      "1-36": "74.5",
      "1-37": "10.6",
      "1-38": "15",
      "1-39": "8",
      "1-40": "4",
      "1-41": "2",
      "1-42": "22",
      "1-43": "6",
      "1-44": "0",
      "1-45": "1",
      "2-1": "TRANSMERALDA S.A.S",
      "2-2": "TM-002",
      "2-3": "ABC123",
      "2-4": "MARIA RODRIGUEZ GARCIA",
      "2-6": "8.0",
      "2-7": "9.0",
      "2-8": "7.5",
      "2-36": "24.5",
      "2-37": "8.2",
      "2-38": "5",
      "2-39": "3",
      "3-1": "COOPERATIVA DEL SUR",
      "3-2": "CS-001",
      "3-3": "XYZ789",
      "3-4": "CARLOS MENDEZ LOPEZ",
      "3-6": "9.0",
      "3-7": "8.5",
      "3-36": "17.5",
      "3-37": "8.8",
      "3-38": "4",
      "3-39": "1",
      "4-1": "NUEVA EMPRESA LTDA",
      "4-2": "NE-001",
      "4-3": "DEF456",
      "4-4": "ANA SOFIA MARTINEZ",
      "4-6": "11.0",
      "4-7": "10.0",
      "4-36": "21.0",
      "4-37": "10.5",
      "4-38": "6",
      "4-39": "2",
    },
  }), []);

  // Funciones utilitarias
  const getMonthKey = useCallback(
    (month: number, year: number) =>
      `${year}-${month.toString().padStart(2, "0")}`,
    [],
  );

  const getDaysInMonth = useCallback(
    (month: number, year: number) => new Date(year, month, 0).getDate(),
    [],
  );

  const isSunday = useCallback((day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0;
  }, []);

  // Inicialización de datos
  useEffect(() => {
    setAllMonthsData(sampleDataByMonth);
  }, [sampleDataByMonth]);

  // Datos del mes actual
  const getCurrentMonthData = useCallback(() => {
    const monthKey = getMonthKey(currentMonth, currentYear);
    const monthData = allMonthsData[monthKey];
    
    if (!monthData) {
      return {};
    }
    
    return monthData;
  }, [allMonthsData, currentMonth, currentYear, getMonthKey]);

  // Función para obtener valores únicos de una columna
  const getUniqueValues = useCallback((columnIndex: number) => {
    const currentData = getCurrentMonthData();
    const values = new Set<string>();
    
    Object.keys(currentData).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (col === columnIndex) {
        const value = currentData[key];
        if (value && value.trim()) {
          values.add(value);
        }
      }
    });
    
    return Array.from(values).sort();
  }, [getCurrentMonthData]);

  // Función para filtrar filas
  const getFilteredRows = useCallback(() => {
    const currentData = getCurrentMonthData();
    const filteredRows = [];
    
    for (let row = 1; row <= 25; row++) {
      const empresa = currentData[`${row}-1`] || "";
      const planilla = currentData[`${row}-2`] || "";
      const placa = currentData[`${row}-3`] || "";
      const conductor = currentData[`${row}-4`] || "";
      
      // Aplicar filtros
      const matchesEmpresa = !filters.empresa || empresa.toLowerCase().includes(filters.empresa.toLowerCase());
      const matchesPlanilla = !filters.planilla || planilla.toLowerCase().includes(filters.planilla.toLowerCase());
      const matchesPlaca = !filters.placa || placa.toLowerCase().includes(filters.placa.toLowerCase());
      const matchesConductor = !filters.conductor || conductor.toLowerCase().includes(filters.conductor.toLowerCase());
      
      if (matchesEmpresa && matchesPlanilla && matchesPlaca && matchesConductor) {
        // Verificar si la fila tiene contenido
        const hasContent = columnHeaders.slice(1).some((_, colIndex) => {
          const cellValue = currentData[`${row}-${colIndex + 1}`];
          return cellValue && cellValue.trim() !== "";
        });
        
        if (hasContent) {
          filteredRows.push(row);
        }
      }
    }
    
    return filteredRows;
  }, [getCurrentMonthData, filters, columnHeaders]);

  const getCellValue = useCallback(
    (row, col) => {
      const currentData = getCurrentMonthData();
      return currentData[`${row}-${col}`] || "";
    },
    [getCurrentMonthData],
  );

  const checkRowHasContent = useCallback(
    (row) => {
      const filteredRows = getFilteredRows();
      return filteredRows.includes(row);
    },
    [getFilteredRows],
  );

  // Handlers
  const handleDateChange = useCallback((newMonth: number, newYear: number) => {
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedCell({ row: 1, col: 1 });
    setSelectedRow(null);
    // Limpiar filtros al cambiar fecha
    setFilters({
      empresa: "",
      planilla: "",
      placa: "",
      conductor: "",
    });
  }, []);

  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearFilter = useCallback((filterType: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: ""
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      empresa: "",
      planilla: "",
      placa: "",
      conductor: "",
    });
  }, []);

  const toggleFilterVisibility = useCallback((filterType: string) => {
    setShowFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  }, []);

  // Función para renderizar header con filtro
  const renderFilterableHeader = useCallback((header: string, colIndex: number) => {
    const filterMap = {
      1: { key: "empresa", values: getUniqueValues(1) },
      2: { key: "planilla", values: getUniqueValues(2) },
      3: { key: "placa", values: getUniqueValues(3) },
      4: { key: "conductor", values: getUniqueValues(4) },
    };

    const filterConfig = filterMap[colIndex];
    if (!filterConfig) return header;

    const { key, values } = filterConfig;
    const hasFilter = filters[key];
    const showFilterInput = showFilters[key];

    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-1">
          <span className="flex-1 text-center">{header}</span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className={`min-w-unit-6 w-6 h-6 ${hasFilter ? 'text-emerald-600' : 'text-gray-400'}`}
            onPress={() => toggleFilterVisibility(key)}
          >
            <Filter size={12} />
          </Button>
        </div>
        
        {showFilterInput && (
          <div className="mt-2 space-y-2">
            {/* Input de búsqueda */}
            <Input
              size="sm"
              placeholder={`Buscar ${header.toLowerCase()}...`}
              value={filters[key]}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              startContent={<Search size={12} />}
              endContent={
                hasFilter && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="min-w-unit-4 w-4 h-4"
                    onPress={() => clearFilter(key)}
                  >
                    <X size={10} />
                  </Button>
                )
              }
              className="text-xs"
            />
            
            {/* Dropdown con valores únicos */}
            {values.length > 0 && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="flat"
                    className="w-full justify-between text-xs"
                    endContent={<ChevronDown size={12} />}
                  >
                    Seleccionar
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={`Seleccionar ${header}`}
                  onAction={(value) => handleFilterChange(key, value as string)}
                  className="max-h-48 overflow-y-auto"
                >
                  {values.map((value) => (
                    <DropdownItem key={value} className="text-xs">
                      {value}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        )}
      </div>
    );
  }, [filters, showFilters, getUniqueValues, toggleFilterVisibility, handleFilterChange, clearFilter]);

  const handleCellClick = useCallback((row, col) => {
    setSelectedCell({ row, col });
  }, []);

  const handleViewButtonClick = useCallback(
    (row) => {
      const currentData = getCurrentMonthData();
      const rowData = {};
      let hasContent = false;

      columnHeaders.forEach((header, colIndex) => {
        const cellValue = currentData[`${row}-${colIndex}`];
        if (cellValue && cellValue.trim() !== "") hasContent = true;
        rowData[header] = cellValue || "";
      });

      if (hasContent) {
        const fullRowData = {
          rowIndex: row,
          monthKey: getMonthKey(currentMonth, currentYear),
          month: MONTH_NAMES[currentMonth - 1],
          year: currentYear,
          data: rowData,
        };

        setModalData(fullRowData);
        setIsModalOpen(true);
      }
    },
    [getCurrentMonthData, columnHeaders, getMonthKey, currentMonth, currentYear, MONTH_NAMES],
  );

  // Estilos y configuraciones
  const getColumnWidth = useCallback((colIndex: number) => {
    if (colIndex === 0) return COLUMN_CONFIG.VER.width;
    if (colIndex === 1) return COLUMN_CONFIG.EMPRESA.width;
    if (colIndex === 2) return COLUMN_CONFIG["No. PLANILLA"].width;
    if (colIndex === 3) return COLUMN_CONFIG.PLACA.width;
    if (colIndex === 4) return COLUMN_CONFIG.CONDUCTOR.width;
    if (colIndex >= 5 && colIndex <= 35) return COLUMN_CONFIG.DAY.width;
    return COLUMN_CONFIG.SUMMARY.width;
  }, []);

  const getHeaderStyle = useCallback(
    (colIndex: number) => {
      const hasAnyFilter = Object.values(filters).some(filter => filter !== "");
      const hasColumnFilter = [1, 2, 3, 4].includes(colIndex) && 
        filters[["", "empresa", "planilla", "placa", "conductor"][colIndex]];

      if (colIndex === 0)
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      
      // Destacar columnas con filtros activos
      if (hasColumnFilter) {
        return "bg-emerald-200 text-emerald-900 border-emerald-300";
      }
      
      if (colIndex >= 5 && colIndex <= 35) {
        const day = colIndex - 4;
        const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);

        if (
          day <= daysInCurrentMonth &&
          isSunday(day, currentMonth, currentYear)
        ) {
          return "bg-emerald-500 text-white border-emerald-200";
        }
        if (day > daysInCurrentMonth) {
          return "bg-gray-100 text-gray-400 border-gray-200";
        }
      }
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    },
    [currentMonth, currentYear, getDaysInMonth, isSunday, filters],
  );

  const handleNewRecargo = () => {
    setModalNewRecargo(!modalNewRecargo);
  };

  const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);
  const filteredRows = getFilteredRows();
  const activeFiltersCount = Object.values(filters).filter(f => f !== "").length;

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-emerald-50 to-emerald-50 overflow-hidden">
      {/* Header */}
      <div>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Building2 size={28} />
              <div>
                <h1 className="text-2xl font-bold">LIQUIDADOR DE RECARGOS</h1>
                <p className="text-emerald-100 text-sm flex items-center gap-2">
                  <FileText size={14} />
                  Código: OP-FR-06 | Versión: 2.0 | {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DateNavigation
                currentMonth={currentMonth}
                currentYear={currentYear}
                onDateChange={handleDateChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar con estadísticas y filtros */}
      <Card className="rounded-none">
        <CardBody className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </Chip>
              <Chip color="secondary" variant="flat">
                Días del Mes: {daysInCurrentMonth}
              </Chip>
              <Chip color="success" variant="flat">
                Registros: {filteredRows.length}
              </Chip>
              {activeFiltersCount > 0 && (
                <Chip color="warning" variant="flat">
                  Filtros activos: {activeFiltersCount}
                </Chip>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  startContent={<X size={14} />}
                  onPress={clearAllFilters}
                >
                  Limpiar Filtros
                </Button>
              )}
              <Button
                variant="flat"
                color="primary"
                startContent={<Plus size={16} />}
                size="md"
                onPress={handleNewRecargo}
              >
                Nuevo Recargo
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla principal */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="relative">
          {/* Headers con filtros */}
          <div className="sticky top-0 z-20 flex border-b-2 border-gray-300">
            {columnHeaders.map((header, colIndex) => (
              <div
                key={colIndex}
                className={`border-r border-gray-300 flex flex-col items-center justify-center text-xs font-bold p-2 ${getHeaderStyle(colIndex)}`}
                style={{
                  width: getColumnWidth(colIndex),
                  minWidth: getColumnWidth(colIndex),
                  minHeight: [1, 2, 3, 4].includes(colIndex) && showFilters[["", "empresa", "planilla", "placa", "conductor"][colIndex]] ? "120px" : "",
                }}
              >
                <div className="leading-tight text-center w-full">
                  {[1, 2, 3, 4].includes(colIndex) ? 
                    renderFilterableHeader(header, colIndex) : 
                    <div>
                      {header}
                      {colIndex >= 38 && colIndex <= 45 && (
                        <div className="text-[10px] mt-1 opacity-75">
                          {RECARGO_CONFIG[colIndex - 38]?.percent}
                        </div>
                      )}
                    </div>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Rows filtradas */}
          {Array.from({ length: 25 }, (_, row) => {
            const rowIndex = row + 1;
            const hasContent = checkRowHasContent(rowIndex);
            const isRowSelected = selectedRow === rowIndex;

            // Solo mostrar filas que pasan el filtro
            if (!hasContent) return null;

            return (
              <div
                key={rowIndex}
                className={`flex border-b border-gray-200 transition-all duration-200 ${
                  hasContent
                    ? isRowSelected
                      ? "bg-emerald-100 shadow-sm"
                      : "hover:bg-emerald-50"
                    : "hover:bg-gray-50"
                }`}
              >
                {columnHeaders.map((_, colIndex) => {
                  return (
                    <div
                      key={colIndex}
                      className={`border-r border-gray-200 relative h-10 transition-all ${hasContent ? "bg-white" : "bg-gray-50"}`}
                      style={{
                        width: getColumnWidth(colIndex),
                        minWidth: getColumnWidth(colIndex),
                      }}
                      onClick={(e) => {
                        if (colIndex !== 0) {
                          e.stopPropagation();
                          handleCellClick(rowIndex, colIndex);
                        }
                      }}
                    >
                      {colIndex === 0 ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tooltip
                            content={
                              hasContent
                                ? "Ver detalles del conductor"
                                : "Sin datos"
                            }
                          >
                            <Button
                              isIconOnly
                              size="sm"
                              color={hasContent ? "primary" : "default"}
                              variant={hasContent ? "solid" : "flat"}
                              isDisabled={!hasContent}
                              onPress={(e) => handleViewButtonClick(rowIndex, e)}
                              className="min-w-unit-8 w-8 h-6"
                            >
                              <Eye size={14} />
                            </Button>
                          </Tooltip>
                        </div>
                      ) : (
                        <div
                          className={`w-full h-full px-2 flex items-center text-xs ${
                            colIndex >= 36 ? "justify-center" : "justify-center"
                          } ${hasContent ? "text-gray-900" : "text-gray-400"}`}
                        >
                          {getCellValue(rowIndex, colIndex)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* Mensaje cuando no hay resultados */}
          {filteredRows.length === 0 && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="text-center">
                <Filter size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No se encontraron registros</p>
                <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de recargos */}
      <Card className="rounded-none">
        <CardBody className="py-3">
          <div className="grid grid-cols-4 gap-3">
            {RECARGO_CONFIG.map((recargo) => (
              <Chip
                key={recargo.key}
                size="sm"
                color={recargo.color}
                variant="flat"
              >
                <span className="font-semibold">{recargo.key}:</span>{" "}
                {recargo.label} ({recargo.percent})
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal
        hideCloseButton
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={20} />
                    Detalles del Conductor - Fila {modalData?.rowIndex}
                  </div>
                  <Button size="sm" isIconOnly onPress={onClose}>
                    X
                  </Button>
                </div>
                <p className="text-emerald-100 text-sm">
                  {modalData?.month} {modalData?.year} - {modalData?.data?.EMPRESA}
                </p>
              </ModalHeader>
              <ModalBody className="p-6">
                {modalData && (
                  <div className="space-y-6">
                    {/* Contenido del modal simplificado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <User size={18} className="text-emerald-600" />
                            Información del Conductor
                          </h3>
                        </CardHeader>
                        <CardBody className="pt-0 space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Nombre</p>
                            <p className="font-medium">
                              {modalData.data.CONDUCTOR || "No especificado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Empresa</p>
                            <Chip color="primary" variant="flat">
                              {modalData.data.EMPRESA || "No especificada"}
                            </Chip>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-gray-600">Vehículo</p>
                              <Chip
                                color="secondary"
                                variant="flat"
                                startContent={<Car size={14} />}
                              >
                                {modalData.data.PLACA || "N/A"}
                              </Chip>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Planilla</p>
                              <Chip
                                color="default"
                                variant="flat"
                                startContent={<FileText size={14} />}
                              >
                                {modalData.data["No. PLANILLA"] || "N/A"}
                              </Chip>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <ModalNewRecargo isOpen={modalNewRecargo} onClose={handleNewRecargo} />
    </div>
  );
};

export default PlanillaRecargos;