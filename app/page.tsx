"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Calendar,
  Eye,
  BarChart3,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  PlusIcon,
  Clock,
  FileText,
  FileX,
  Trash2,
  Minus,
  Copy,
} from "lucide-react";
import ModalFormRecargo from "@/components/ui/modalFormRecargo";
import {
  CanvasRecargo,
  DiaLaboralPlanilla,
  useRecargo,
} from "@/context/RecargoPlanillaContext";
import ModalConfiguracion from "@/components/ui/modalConfiguracion";
import { Button } from "@heroui/button";
import ModalVisualizarRecargo from "@/components/ui/modalVisualizarRecargo";
import { formatearCOP } from "@/helpers";
import { ConfiguracionSalario } from "@/types";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { useEliminarRecargoConfirm } from "@/components/ui/eliminarRecargoConfirm";
import { apiClient } from "@/config/apiClient";
import { useLiquidarRecargoConfirm } from "@/components/ui/liquidarRecargoConfirm";

interface ShowFilters {
  conductores: boolean;
  empresas: boolean;
  estados: boolean;
  planillas: boolean;
  placas: boolean;
}

type FilterKey =
  | "conductores"
  | "empresas"
  | "estados"
  | "planillas"
  | "placas";

interface Filters {
  conductores: string[];
  empresas: string[];
  planillas: string[];
  placas: string[];
  estados: string[];
}

interface Column {
  // Propiedades básicas requeridas
  key: string;
  label: string;
  width: string;

  // Propiedades opcionales (pueden no estar presentes en todos los objetos)
  sortable?: boolean;
  filterable?: boolean;
  fixed?: boolean;
  align?: string;

  // Propiedades específicas para columnas de día
  isDayColumn?: boolean;
  isSunday?: boolean;
  isHoliday?: boolean;
  day?: number; // Basado en el error, algunos objetos tienen esta propiedad

  // Si es columna de resumen
  isSummary?: boolean;

  // Propiedades adicionales opcionales
  visible?: boolean;
  minWidth?: string | number;
  type?: "text" | "number" | "date" | "currency" | "status" | "boolean";
  resizable?: boolean;
  draggable?: boolean;

  // Funciones de renderizado y formato
  render?: (value: any, row: any, column: Column) => React.ReactNode;
  format?: (value: any) => string;
  sortFunction?: (a: any, b: any) => number;

  // CSS classes
  className?: string;
  headerClassName?: string;
  cellClassName?: string;

  // Configuración de filtros
  tooltip?: string;
  filterPlaceholder?: string;
  filterType?: "text" | "select" | "multiselect" | "date" | "number";
  filterOptions?: Array<{ label: string; value: any }>;

  // Edición inline
  editable?: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };

  // Metadatos adicionales
  meta?: Record<string, any>;
}

// Datos de meses
const months = [
  { key: 1, label: "Enero", short: "Ene" },
  { key: 2, label: "Febrero", short: "Feb" },
  { key: 3, label: "Marzo", short: "Mar" },
  { key: 4, label: "Abril", short: "Abr" },
  { key: 5, label: "Mayo", short: "May" },
  { key: 6, label: "Junio", short: "Jun" },
  { key: 7, label: "Julio", short: "Jul" },
  { key: 8, label: "Agosto", short: "Ago" },
  { key: 9, label: "Septiembre", short: "Sep" },
  { key: 10, label: "Octubre", short: "Oct" },
  { key: 11, label: "Noviembre", short: "Nov" },
  { key: 12, label: "Diciembre", short: "Dic" },
];

const CanvasRecargosDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("conductor");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewModalState, setViewModalState] = useState<{
    isOpen: boolean;
    recargoId: string | null;
  }>({
    isOpen: false,
    recargoId: null,
  });
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  const handleViewRecargo = (recargoId: string) => {
    setViewModalState({
      isOpen: true,
      recargoId: recargoId,
    });
  };

  const getCellCopyValue = (item: CanvasRecargo, column: Column): string => {
    switch (column.key) {
      case "select":
      case "acciones":
        return "";

      case "empresa":
        const empresaNombre = item.empresa?.nombre || "";
        return empresaNombre; // ✅ Todo en una celda

      case "numero_planilla":
        return item.numero_planilla || "";

      case "vehiculo":
        return item.vehiculo?.placa || "";

      case "conductor":
        const nombreCompleto =
          `${item.conductor?.nombre || ""} ${item.conductor?.apellido || ""}`.trim();
        return nombreCompleto;

      case "valor_total":
        return obtenerTotalRecargos(item).toString();

      case "estado":
        return item.estado || "";

      case "total_horas":
        return (item.total_horas || 0).toString();

      case "promedio_diario":
        return (item.total_horas / item.total_dias || 0).toFixed(2);

      case "dias_laborales":
        return (item.dias_laborales?.length || 0).toString();

      case "total_hed":
        return toNumber(item.total_hed).toFixed(1);
      case "total_hen":
        return toNumber(item.total_hen).toFixed(1);
      case "total_hefd":
        return toNumber(item.total_hefd).toFixed(1);
      case "total_hefn":
        return toNumber(item.total_hefn).toFixed(1);
      case "total_rn":
        return toNumber(item.total_rn).toFixed(1);
      case "total_rd":
        return toNumber(item.total_rd).toFixed(1);

      default:
        if (column.isDayColumn) {
          const dayData = item.dias_laborales?.find(
            (d) => d.dia === column.day,
          );
          return dayData ? toNumber(dayData.total_horas).toFixed(1) : "-";
        }
        return getItemValue(item, column.key)?.toString() || "0";
    }
  };

  // Función mejorada para copiar múltiples filas seleccionadas
  const handleCopySelectedRows = async () => {
    try {
      // Definir el orden EXACTO para copiar
      const orderedKeys = [
        "empresa",
        "numero_planilla",
        "vehiculo",
        "conductor",
        ...Array.from(
          { length: getDaysInMonth(selectedMonth, selectedYear) },
          (_, i) => `day_${i + 1}`,
        ),
        "total_horas",
        "promedio_diario",
        "total_hed",
        "total_hen",
        "total_hefd",
        "total_hefn",
        "total_rn",
        "total_rd",
      ];

      // Filtrar los rows seleccionados
      const selectedRowsData = processedDataWithTotals.filter((row) =>
        selectedRows.has(row.id),
      );

      // Crear array de filas copiadas
      const rowsToCopy = selectedRowsData.map((item) =>
        orderedKeys
          .map((key) => {
            const column = columns.find((col) => col.key === key);
            return column ? getCellCopyValue(item, column) : "";
          })
          .join("\t"),
      );

      // Unir todas las filas con salto de línea
      const textToCopy = rowsToCopy.join("\n");

      // Intentar con Clipboard API moderna
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        copyToClipboardFallback(textToCopy);
      }

      // Feedback visual
      const firstId = Array.from(selectedRows)[0];
      setCopiedRowId(typeof firstId === "string" ? firstId : null);
      setTimeout(() => setCopiedRowId(null), 2000);
    } catch {
      // Error silenciado - no es crítico para la funcionalidad
      alert(
        "No se pudo copiar. Por favor, intenta seleccionar y copiar manualmente.",
      );
    }
  };

  // Función fallback para copiar (método antiguo pero compatible)
  const copyToClipboardFallback = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      if (!successful) {
        throw new Error("execCommand failed");
      }
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const {
    socketConnected,
    diasFestivos,
    configuracionesSalario,
    tiposRecargo,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    canvasData,
  } = useRecargo();

  const { confirm: eliminarRecargoConfirm, setLoading: setEliminarLoading, DialogComponent: EliminarDialog } = useEliminarRecargoConfirm();
  const { confirm: liquidarRecargoConfirm, setLoading: setLiquidarLoading, DialogComponent: LiquidarDialog } = useLiquidarRecargoConfirm
    ();

  const [modalFormIsOpen, setModalFormIsOpen] = useState(false);
  const [recargoId, setRecargoId] = useState("");

  const recargos = useMemo(
    () => canvasData?.recargos || [],
    [canvasData?.recargos],
  );

  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    conductores: [],
    empresas: [],
    estados: [],
    planillas: [],
    placas: [],
  });

  // Estados de visibilidad de filtros
  const [showFilters, setShowFilters] = useState<ShowFilters>({
    conductores: false,
    empresas: false,
    estados: false,
    planillas: false,
    placas: false,
  });

  const handleOpenFormModal = () => {
    setRecargoId("");
    setModalFormIsOpen(!modalFormIsOpen);
  };

  const handleEliminar = async () => {
    const result = await eliminarRecargoConfirm({
      title: "Eliminar recargos",
      message: "¿Deseas eliminar los recargos seleccionados?",
      selectedCount: selectedRows.size,
      confirmText: "Sí, eliminar",
    });

    if (result.confirmed) {
      try {
        setEliminarLoading(true);
        await apiClient.delete("/api/recargos/eliminar", {
          data: {
            selectedIds: Array.from(selectedRows), // Convierte Set a Array
          },
        });

        setSelectedRows(new Set());
      } catch {
        // Error manejado silenciosamente
      } finally {
        setEliminarLoading(false);
      }
    }
  };

  const handleLiquidar = async () => {
    const result = await liquidarRecargoConfirm({
      title: "Liquidar recargos",
      message: "¿Deseas liquidar los recargos seleccionados?",
      planillasLength: selectedRows.size,
      confirmText: "Sí, liquidar",
    });

    if (result.confirmed) {
      try {
        setLiquidarLoading(true);
        await apiClient.patch("/api/recargos/liquidar", {
          data: {
            selectedIds: Array.from(selectedRows), // Convierte Set a Array
          },
        });

        setSelectedRows(new Set());
      } catch {
        // Error manejado silenciosamente
      } finally {
        setLiquidarLoading(false);
      }
    }
  };

  // Función para obtener días del mes seleccionado
  const getDaysInMonth = useCallback((month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  }, []);

  // Función para verificar si un día es domingo
  const isSunday = useCallback((day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0;
  }, []);

  // Función para verificar si un día es festivo
  const isHoliday = useCallback(
    (day: number, month: number) => {
      return diasFestivos.some(
        (holiday) =>
          holiday.mes === month &&
          holiday.dia === day &&
          holiday.año === selectedYear,
      );
    },
    [diasFestivos, selectedYear],
  ); // ✅ Agregar dependencias correctas

  // Configuración de columnas dinámicas
  const columns = useMemo(() => {
    const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);

    const baseColumns = [
      {
        key: "select",
        label: "",
        width: "50px",
        sortable: false,
        filterable: false,
        fixed: true,
      },
      {
        key: "acciones",
        label: "ACCIONES",
        width: "100px",
        sortable: false,
        align: "center",
        isSummary: false,
        fixed: true,
      },
      {
        key: "conductor",
        label: "CONDUCTOR",
        width: "300px",
        sortable: true,
        filterable: true,
        align: "left",
        fixed: true,
      },
      {
        key: "empresa",
        label: "EMPRESA",
        width: "200px",
        sortable: true,
        filterable: true,
        align: "left",
        fixed: true,
      },
      {
        key: "numero_planilla",
        label: "PLANILLA",
        width: "120px",
        sortable: true,
        filterable: true,
        align: "center",
        fixed: true,
      },
      {
        key: "vehiculo",
        label: "PLACA",
        width: "120px",
        sortable: true,
        filterable: true,
        align: "center",
        fixed: true,
      },
    ];

    // Generar columnas para cada día del mes
    const dayColumns = Array.from({ length: daysInCurrentMonth }, (_, i) => {
      const day = i + 1;
      const isSundayDay = isSunday(day, selectedMonth, selectedYear);
      const isHolidayDay = isHoliday(day, selectedMonth);

      return {
        key: `day_${day}`,
        label: day.toString(),
        width: "55px",
        sortable: false,
        align: "center",
        isDayColumn: true,
        isSunday: isSundayDay,
        isHoliday: isHolidayDay,
        day: day,
      };
    });

    const summaryColumns = [
      {
        key: "total_horas",
        label: "TOTAL\nHORAS",
        width: "80px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "promedio_diario",
        label: "PROM.\nDIARIO",
        width: "80px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_hed",
        label: "HED\n(25%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_hen",
        label: "HEN\n(75%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_hefd",
        label: "HEFD\n(100%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_hefn",
        label: "HEFN\n(150%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_rn",
        label: "RN\n(35%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "total_rd",
        label: "RD\n(75%)",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "dias_laborales",
        label: "DÍAS\nLAB.",
        width: "70px",
        sortable: true,
        align: "center",
        isSummary: true,
      },
      {
        key: "valor_total",
        label: "VALOR TOTAL",
        width: "130px",
        sortable: true,
        align: "right",
        isSummary: true,
      },
      {
        key: "estado",
        label: "ESTADO",
        width: "100px",
        sortable: true,
        filterable: true,
        align: "center",
        isSummary: true,
      },
    ];

    return [...baseColumns, ...dayColumns, ...summaryColumns];
  }, [selectedMonth, selectedYear, getDaysInMonth, isSunday, isHoliday]);

  const MAPEO_CAMPOS_HORAS = useMemo(() => ({
    HED: "total_hed", // Horas Extra Diurnas
    HEN: "total_hen", // Horas Extra Nocturnas
    HEFD: "total_hefd", // Horas Extra Festivas Diurnas
    HEFN: "total_hefn", // Horas Extra Festivas Nocturnas
    RN: "total_rn", // Recargo Nocturno
    RD: "total_rd", // Recargo Dominical Diurno
  } as const), []);

  const calcularTotalesRecargos = (diasLaborales: DiaLaboralPlanilla[]) => {
    if (!diasLaborales || diasLaborales.length === 0) {
      return {
        total_hed: 0,
        total_hen: 0,
        total_hefd: 0,
        total_hefn: 0,
        total_rn: 0,
        total_rd: 0,
      };
    }

    return diasLaborales.reduce(
      (acc, dia) => ({
        total_hed: acc.total_hed + (Number(dia.hed) || 0),
        total_hen: acc.total_hen + (Number(dia.hen) || 0),
        total_hefd: acc.total_hefd + (Number(dia.hefd) || 0),
        total_hefn: acc.total_hefn + (Number(dia.hefn) || 0),
        total_rn: acc.total_rn + (Number(dia.rn) || 0),
        total_rd: acc.total_rd + (Number(dia.rd) || 0),
      }),
      {
        total_hed: 0,
        total_hen: 0,
        total_hefd: 0,
        total_hefn: 0,
        total_rn: 0,
        total_rd: 0,
      },
    );
  };

  const processedDataWithTotals = useMemo(() => {
    return recargos.map((item) => {
      const totalesCalculados = calcularTotalesRecargos(item.dias_laborales);
      return {
        ...item,
        // ✅ Sobrescribir con totales calculados desde dias_laborales
        ...totalesCalculados,
      };
    });
  }, [recargos]);

  const getSortValue = (item: CanvasRecargo, field: string): any => {
    switch (field) {
      case "conductor":
        return `${item.conductor?.nombre} ${item.conductor?.apellido}`;
      case "empresa":
        return item.empresa?.nombre;
      case "vehiculo":
        return item.vehiculo?.placa;
      case "numero_planilla":
        return item.numero_planilla;
      case "total_horas":
        return item.total_horas;
      case "total_hed":
        return item.total_hed;
      case "total_hen":
        return item.total_hen;
      case "total_hefd":
        return item.total_hefd;
      case "total_hefn":
        return item.total_hefn;
      case "total_rn":
        return item.total_rn;
      case "total_rd":
        return item.total_rd;
      case "total_dias_laborados":
        return item.total_dias_laborados;
      default:
        // Para campos dinámicos, usar type assertion con verificación
        return (item as any)[field] || 0;
    }
  };

  // Obtener valores únicos filtrados (excluyendo el filtro actual para evitar dependencias circulares)
  // Esta función implementa filtros dependientes: cuando seleccionas una empresa,
  // solo muestra conductores, placas y planillas asociadas a esa empresa
  const getFilteredUniqueValues = useCallback(
    (field: string, excludeCurrentFilter = true) => {
      // Crear una copia de los filtros excluyendo el filtro actual si es necesario
      // Esto evita dependencias circulares (ej: filtro de empresas depende de filtro de empresas)
      const activeFilters = excludeCurrentFilter 
        ? { ...filters, [field]: [] } 
        : filters;

      // Filtrar los datos basándose en los filtros activos (excluyendo el actual)
      let filteredData = [...processedDataWithTotals];

      // ✅ FILTROS DEPENDIENTES: Cada filtro afecta las opciones de los demás
      
      // Aplicar filtros de empresas (afecta conductores, placas y planillas)
      if (activeFilters.empresas && activeFilters.empresas.length > 0) {
        filteredData = filteredData.filter((item) =>
          activeFilters.empresas.includes(item.empresa?.nombre || "Sin empresa")
        );
      }

      // Aplicar filtros de estados (afecta todos los demás filtros)
      if (activeFilters.estados && activeFilters.estados.length > 0) {
        filteredData = filteredData.filter((item) =>
          activeFilters.estados.includes(item.estado || "pendiente")
        );
      }

      // Aplicar filtros de planillas (afecta conductores y placas de esa planilla)
      if (activeFilters.planillas && activeFilters.planillas.length > 0) {
        filteredData = filteredData.filter((item) =>
          activeFilters.planillas.includes(item.numero_planilla || "")
        );
      }

      // Aplicar filtros de placas (afecta conductores que manejan esas placas)
      if (activeFilters.placas && activeFilters.placas.length > 0) {
        filteredData = filteredData.filter((item) =>
          activeFilters.placas.includes(item.vehiculo?.placa || "")
        );
      }

      // Aplicar filtros de conductores (afecta placas y planillas de esos conductores)
      if (activeFilters.conductores && activeFilters.conductores.length > 0) {
        filteredData = filteredData.filter((item) => {
          const conductorNombre = `${item.conductor?.nombre} ${item.conductor?.apellido}`.trim() || "Sin conductor";
          return activeFilters.conductores.includes(conductorNombre);
        });
      }

      // Ahora obtener valores únicos del campo solicitado de los datos filtrados
      const values = new Set();
      filteredData.forEach((item) => {
        let value = "";
        switch (field) {
          case "empresas":
            value = item.empresa?.nombre || "Sin empresa";
            break;
          case "estados":
            value = item.estado || "pendiente";
            break;
          case "planillas":
            value = item.numero_planilla || "";
            break;
          case "placas":
            value = item.vehiculo?.placa || "";
            break;
          case "conductores":
            value =
              `${item.conductor?.nombre} ${item.conductor?.apellido}`.trim() ||
              "Sin conductor";
            break;
        }
        if (value && value.trim()) values.add(value);
      });

      return Array.from(values).sort();
    },
    [processedDataWithTotals, filters],
  );

  // Datos filtrados y ordenados
  const processedData = useMemo(() => {
    let result = [...processedDataWithTotals];

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(
        (item) =>
          `${item.conductor?.nombre} ${item.conductor?.apellido}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.vehiculo?.placa
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.empresa?.nombre
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.empresa?.nit
            .replace(/\./g, "")
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.numero_planilla
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Aplicar filtros
    if (filters.conductores.length > 0) {
      result = result.filter((item) => {
        const nombreCompleto = `${item.conductor?.nombre} ${item.conductor?.apellido}`;
        return filters.conductores.includes(nombreCompleto);
      });
    }
    if (filters.empresas.length > 0) {
      result = result.filter((item) =>
        filters.empresas.includes(item.empresa?.nombre),
      );
    }
    if (filters.estados.length > 0) {
      result = result.filter((item) => filters.estados.includes(item.estado));
    }
    if (filters.planillas.length > 0) {
      result = result.filter((item) =>
        filters.planillas.includes(item.numero_planilla),
      );
    }
    if (filters.placas.length > 0) {
      result = result.filter((item) =>
        filters.placas.includes(item.vehiculo?.placa),
      );
    }

    // ✅ Aplicar ordenamiento con función helper
    result.sort((a: CanvasRecargo, b: CanvasRecargo) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      // Normalizar strings para comparación
      let normalizedA = aValue;
      let normalizedB = bValue;

      if (typeof aValue === "string" && typeof bValue === "string") {
        normalizedA = aValue.toLowerCase();
        normalizedB = bValue.toLowerCase();
      }

      // Realizar comparación
      if (sortDirection === "asc") {
        return normalizedA < normalizedB
          ? -1
          : normalizedA > normalizedB
            ? 1
            : 0;
      } else {
        return normalizedA > normalizedB
          ? -1
          : normalizedA < normalizedB
            ? 1
            : 0;
      }
    });

    return result;
  }, [processedDataWithTotals, searchTerm, filters, sortField, sortDirection]);

  const obtenerTotalRecargos = useCallback((item: CanvasRecargo): number => {
    // Función para obtener salario base dentro del callback
    const obtenerSalarioBase = (
      item: CanvasRecargo,
    ): ConfiguracionSalario | null => {
      if (!item?.empresa?.id) {
        return null;
      }

      if (!configuracionesSalario || !Array.isArray(configuracionesSalario)) {
        return null;
      }

      let configuracionGlobal: ConfiguracionSalario | null = null;

      for (const salario of configuracionesSalario) {
        // Solo considerar configuraciones activas
        if (!salario.activo) {
          continue;
        }

        // Si encontramos configuración específica para la empresa
        if (salario.empresa_id === item.empresa.id) {
          return salario;
        }

        // Guardamos la primera configuración global que encontremos
        if (
          !configuracionGlobal &&
          (salario.empresa_id === null || salario.empresa_id === undefined)
        ) {
          configuracionGlobal = salario;
        }
      }

      return configuracionGlobal;
    };

    // Obtener el salario base para este item
    const configuracionSalario = obtenerSalarioBase(item);

    if (!configuracionSalario) {
      return 0;
    }

    const valorPorHora =
      configuracionSalario.salario_basico /
      configuracionSalario.horas_mensuales_base;

    let totalGeneral = 0;

    const totalFestivos = item.dias_laborales.filter(
      (dia) => dia.es_festivo,
    ).length;
    const totalDomingos = item.dias_laborales.filter(
      (dia) => dia.es_domingo,
    ).length;

    // Filtrar tipos de recargo activos y ordenar por orden de cálculo
    const tiposActivos = tiposRecargo
      .filter((tipo) => tipo.activo)
      .sort((a, b) => a.orden_calculo - b.orden_calculo);

    for (const tipoRecargo of tiposActivos) {
      const pagaDiasFestivos = configuracionSalario.paga_dias_festivos || false;
      let valorCalculado = 0; // ✅ Mover la declaración aquí para que esté disponible en todo el scope

      // Si la configuración paga días festivos, calcular recargo especial para RD
      if (pagaDiasFestivos && tipoRecargo.codigo === "RD") {
        const valorDiarioBase = configuracionSalario.salario_basico / 30;

        const porcentaje = tipoRecargo.porcentaje;

        // ✅ Validar que el porcentaje sea válido
        if (isNaN(porcentaje)) {
          continue;
        }

        const valorRecargo = valorDiarioBase * (1 + porcentaje / 100);

        // Total de días festivos/domingos (evitar duplicados)
        const totalDiasEspeciales = totalFestivos + totalDomingos;

        valorCalculado = totalDiasEspeciales * valorRecargo;

        // ✅ Agregar al total y continuar con el siguiente tipo de recargo
        totalGeneral += valorCalculado;
        continue;
      }

      const campoHoras =
        MAPEO_CAMPOS_HORAS[
        tipoRecargo.codigo as keyof typeof MAPEO_CAMPOS_HORAS
        ];

      if (!campoHoras) {
        continue;
      }

      const horasTrabajadas = item[campoHoras as keyof CanvasRecargo] as number;

      // ✅ Validar que horasTrabajadas sea un número válido
      if (!horasTrabajadas || horasTrabajadas <= 0 || isNaN(horasTrabajadas)) {
        continue;
      }

      if (tipoRecargo.es_valor_fijo && tipoRecargo.valor_fijo) {
        // Para valores fijos (como COVID)
        const valorFijo = tipoRecargo.valor_fijo;
        if (isNaN(valorFijo)) {
          continue;
        }
        valorCalculado = valorFijo;
      } else {
        // Para porcentajes
        const porcentaje = tipoRecargo.porcentaje;

        if (isNaN(porcentaje)) {
          continue;
        }

        if (isNaN(valorPorHora) || valorPorHora <= 0) {
          continue;
        }

        if (tipoRecargo.adicional) {
          const valorHoraConRecargo = valorPorHora * (1 + porcentaje / 100);
          valorCalculado = valorHoraConRecargo * horasTrabajadas;
        } else {
          const valorHoraConRecargo = valorPorHora * (porcentaje / 100);
          valorCalculado = valorHoraConRecargo * horasTrabajadas;
        }
      }

      // ✅ Validar el resultado antes de sumarlo
      if (isNaN(valorCalculado)) {
        continue;
      }

      totalGeneral += valorCalculado;
    }

    return totalGeneral;
  }, [tiposRecargo, MAPEO_CAMPOS_HORAS, configuracionesSalario]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Estadísticas
  const statistics = useMemo(() => {
    if (
      !processedData ||
      !Array.isArray(processedData) ||
      processedData.length === 0
    ) {
      return {
        totalRegistros: 0,
        totalHoras: "0.0",
        totalValor: 0,
        totalHED: "0.0",
        totalHEN: "0.0",
        totalHEFD: "0.0",
        totalHEFN: "0.0",
        totalRN: "0.0",
        totalRD: "0.0",
        totalDias: "0.0",
        empresasActivas: 0,
      };
    }

    // Calcular totales básicos
    const totalHoras = processedData.reduce(
      (acc, item) => acc + (item.total_horas || item.total_horas || 0),
      0,
    );

    const totalesDias = processedData.reduce(
      (acc, item) => acc + item.dias_laborales.length,
      0,
    );

    const totalValor = processedData.reduce(
      (acc, item) => acc + obtenerTotalRecargos(item),
      0,
    );

    // Calcular todos los tipos de recargos
    const totalesRecargos = processedData.reduce(
      (acc, item) => ({
        totalHED: acc.totalHED + (item.total_hed || 0),
        totalHEN: acc.totalHEN + (item.total_hen || 0),
        totalHEFD: acc.totalHEFD + (item.total_hefd || 0),
        totalHEFN: acc.totalHEFN + (item.total_hefn || 0),
        totalRN: acc.totalRN + (item.total_rn || 0),
        totalRD: acc.totalRD + (item.total_rd || 0),
      }),
      {
        totalHED: 0, // Horas Extras Diurnas
        totalHEN: 0, // Horas Extras Nocturnas
        totalHEFD: 0, // Horas Extras Festivas Diurnas
        totalHEFN: 0, // Horas Extras Festivas Nocturnas
        totalRN: 0, // Recargo Nocturno
        totalRD: 0, // Recargo Dominical
      },
    );

    // Calcular empresas únicas
    const empresasActivas = new Set(
      processedData
        .map((item) => item.empresa?.id)
        .filter((id) => id !== null && id !== undefined),
    ).size;

    const resultado = {
      totalRegistros: processedData.length,
      totalHoras: totalHoras.toFixed(1),
      totalValor: totalValor,
      totalHED: totalesRecargos.totalHED.toFixed(1),
      totalHEN: totalesRecargos.totalHEN.toFixed(1),
      totalHEFD: totalesRecargos.totalHEFD.toFixed(1),
      totalHEFN: totalesRecargos.totalHEFN.toFixed(1),
      totalRN: totalesRecargos.totalRN.toFixed(1),
      totalRD: totalesRecargos.totalRD.toFixed(1),
      totalDias: totalesDias.toFixed(1),
      empresasActivas: empresasActivas,
    };

    return resultado;
  }, [processedData, obtenerTotalRecargos]);

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((item) => item.id)));
    }
  };

  // Crea una función helper fuera del render
  const getFilterKey = (columnKey: string): FilterKey => {
    const mapping: Record<string, FilterKey> = {
      conductor: "conductores",
      empresa: "empresas",
      numero_planilla: "planillas",
      vehiculo: "placas",
      estado: "estados"
    };
    return mapping[columnKey] || "estados";
  };

  const toggleFilter = (type: FilterKey) => {
    setShowFilters((prev) => {
      const isCurrentlyOpen = prev[type];
      
      // Si el filtro actual está abierto, solo cerrarlo
      // Si está cerrado, cerrarlo todo y abrir este
      return Object.keys(prev).reduce((acc, key) => {
        if (key === type) {
          // Toggle del filtro actual
          acc[key as FilterKey] = !isCurrentlyOpen;
        } else {
          // Cerrar todos los demás
          acc[key as FilterKey] = false;
        }
        return acc;
      }, {} as ShowFilters);
    });
  };

  const updateFilter = (type: FilterKey, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[type] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      conductores: [],
      empresas: [],
      estados: [],
      planillas: [],
      placas: [],
    });
    setSearchTerm("");
  };

  const getItemValue = (item: CanvasRecargo, columnKey: string): any => {
    // Mapeo de propiedades conocidas
    const knownProperties: Record<string, keyof CanvasRecargo> = {
      id: "id",
      numero_planilla: "numero_planilla",
      conductor: "conductor",
      vehiculo: "vehiculo",
      total_horas: "total_horas",
      total_dias: "total_dias",
      valor_total: "valor_total",
      total_hed: "total_hed",
      total_hen: "total_hen",
    };

    // Si es una propiedad conocida, accederla directamente
    if (knownProperties[columnKey]) {
      return item[knownProperties[columnKey]];
    }

    // Para columnas de días (día_1, día_2, etc.)
    const dayMatch = columnKey.match(/^día?_(\d+)$/);
    if (dayMatch) {
      const dayNumber = parseInt(dayMatch[1], 10);
      const dayData = item.dias.find((d) => d.dia === dayNumber);
      return dayData?.horas || 0;
    }

    // Para propiedades dinámicas, usar type assertion con verificación
    const itemWithDynamicProps = item as CanvasRecargo & Record<string, any>;
    return itemWithDynamicProps[columnKey] || 0;
  };

  const toNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const renderCell = (item: CanvasRecargo, column: Column) => {
    switch (column.key) {
      case "select":
        return (
          <input
            type="checkbox"
            checked={selectedRows.has(item.id)}
            onChange={() => handleSelectRow(item.id)}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 ml-1"
          />
        );

      case "acciones":
        return (
          <div className="flex items-center justify-center space-x-1">
            <Button
              title="Ver"
              isIconOnly
              variant="light"
              size="sm"
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              onPress={() => handleViewRecargo(item.id)}
            >
              <Eye size={14} />
            </Button>
            <Button
              title="Editar"
              isIconOnly
              variant="light"
              size="sm"
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              onPress={() => handleEditRecargo(item.id)}
            >
              <Edit3 size={14} />
            </Button>
          </div>
        );

      case "conductor":
        const nombreCompleto =
          `${item.conductor?.nombre || ""} ${item.conductor?.apellido || ""}`.trim();
        const initials = nombreCompleto
          .split(" ")
          .map((name) => name.charAt(0))
          .slice(0, 2)
          .join("");

        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">
                {nombreCompleto}
              </div>
              <div className="text-xs text-gray-500">
                ID: {item.conductor?.id}
              </div>
            </div>
          </div>
        );

      case "empresa":
        return (
          <div>
            <div className="text-sm text-gray-900">{item.empresa?.nombre}</div>
            <div className="text-xs text-gray-500">
              NIT: {item.empresa?.nit}
            </div>
          </div>
        );

      case "vehiculo":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
            {item.vehiculo?.placa}
          </span>
        );

      case "numero_planilla":
        const tienePlanilla = item.planilla_s3key;
        const tieneNumero = item.numero_planilla;

        // Determinar el estado y colores
        let estado, bgColor, textColor, iconColor;

        if (tienePlanilla && tieneNumero) {
          // Estado completo - success
          estado = "completo";
          bgColor = "bg-green-100";
          textColor = "text-green-600";
          iconColor = "text-green-500";
        } else if (tienePlanilla && !tieneNumero) {
          // Tiene archivo pero falta número - primary
          estado = "falta-numero";
          bgColor = "bg-blue-100";
          textColor = "text-blue-600";
          iconColor = "text-blue-500";
        } else {
          // Sin numero_planilla - danger
          estado = "sin-numero_planilla";
          bgColor = "bg-red-100";
          textColor = "text-red-600";
          iconColor = "text-red-500";
        }

        return (
          <div
            className={`flex items-center gap-2 py-2 px-5 rounded-full ${bgColor}`}
          >
            {tienePlanilla ? (
              <Tooltip content="Con numero_planilla">
                <FileText size={16} className={iconColor} />
              </Tooltip>
            ) : (
              <Tooltip content="Sin numero de planilla">
                <FileX size={16} className={iconColor} />
              </Tooltip>
            )}

            {/* Indicador de estado incompleto */}
            {estado === "falta-numero" && (
              <Tooltip content="Falta número de numero_planilla">
                <Minus size={12} className="text-blue-400" />
              </Tooltip>
            )}

            {/* Número de numero_planilla si existe */}
            {tieneNumero && (
              <span className={`text-xs ${textColor}`}>
                {item.numero_planilla}
              </span>
            )}
          </div>
        );

      case "valor_total":
        return (
          <span className="font-semibold text-green-600">
            {formatearCOP(obtenerTotalRecargos(item))}
          </span>
        );

      case "estado":
        let estadoBg = "bg-blue-100";
        let estadoText = "text-blue-800";
        let estadoLabel = item.estado;

        switch (item.estado?.toLowerCase()) {
          case "pendiente":
            estadoBg = "bg-blue-100";
            estadoText = "text-blue-800";
            estadoLabel = "pendiente";
            break;
          case "liquidada":
            estadoBg = "bg-yellow-100";
            estadoText = "text-yellow-800";
            estadoLabel = "liquidada";
            break;
          case "facturada":
            estadoBg = "bg-green-100";
            estadoText = "text-green-800";
            estadoLabel = "facturada";
            break;
          default:
            estadoBg = "bg-gray-100";
            estadoText = "text-gray-800";
            estadoLabel = item.estado || "Desconocido";
        }

        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium uppercase ${estadoBg} ${estadoText}`}>
            {estadoLabel}
          </span>
        );

      case "total_horas":
        return (
          <span className="font-semibold text-emerald-600">
            {item.total_horas || 0}h
          </span>
        );

      case "promedio_diario":
        return (
          <span className="font-semibold text-emerald-600">
            {(item.total_horas / item.total_dias).toFixed(2) || 0}h
          </span>
        );

      case "dias_laborales":
        return (
          <span className="font-semibold text-blue-600">
            {item.dias_laborales.length || 0}
          </span>
        );

      // ✅ Columnas de totales de recargos (usando toNumber para manejar strings)
      case "total_hed":
        return (
          <span className="font-semibold text-green-600">
            {toNumber(item.total_hed).toFixed(1)}h
          </span>
        );

      case "total_hen":
        return (
          <span className="font-semibold text-blue-600">
            {toNumber(item.total_hen).toFixed(1)}h
          </span>
        );

      case "total_hefd":
        return (
          <span className="font-semibold text-orange-600">
            {toNumber(item.total_hefd).toFixed(1)}h
          </span>
        );

      case "total_hefn":
        return (
          <span className="font-semibold text-indigo-600">
            {toNumber(item.total_hefn).toFixed(1)}h
          </span>
        );

      case "total_rn":
        return (
          <span className="font-semibold text-purple-600">
            {toNumber(item.total_rn).toFixed(1)}h
          </span>
        );

      case "total_rd":
        return (
          <span className="font-semibold text-red-600">
            {toNumber(item.total_rd).toFixed(1)}h
          </span>
        );

      default:
        // ✅ Manejo de columnas de días con recargos detallados
        if (column.isDayColumn) {
          const dayData = item.dias_laborales?.find(
            (d) => d.dia === column.day,
          );

          const hasHours = dayData && toNumber(dayData.total_horas) > 0;

          if (!hasHours) {
            return (
              <div className="text-gray-400 font-medium text-center py-2">
                -
              </div>
            );
          }

          return (
            <div className="text-xs w-full py-1">
              {/* ✅ Horas trabajadas - Siempre visible */}
              <div
                className={`font-bold text-center mb-1 px-1 py-1 rounded ${dayData.es_domingo || dayData.es_festivo
                  ? "text-red-800 bg-red-100 border border-red-200"
                  : "text-emerald-800 bg-emerald-100 border border-emerald-200"
                  }`}
              >
                {toNumber(dayData.total_horas).toFixed(1)}h
              </div>
            </div>
          );
        }

        return (
          <span className="text-sm text-gray-900">
            {getItemValue(item, column.key) || "0"}
          </span>
        );
    }
  };

const renderFilterDropdown = (column: Column) => {
  // Evitar render de columnas no filtrables
  if (!column.filterable) return null;

  const keyMap: Record<string, keyof typeof showFilters> = {
    conductor: "conductores",
    empresa: "empresas",
    numero_planilla: "planillas",
    vehiculo: "placas",
    estado: "estados",
  };

  const validKeys = Object.keys(keyMap);
  const colKey = column.key;

  // Solo procesar columnas que son candidatas para filtros
  if (!validKeys.includes(colKey)) {
    return null;
  }

  // Obtener key mapeado
  const mappedKey = keyMap[colKey];
  const isFilterVisible = showFilters[mappedKey];

  if (!isFilterVisible) {
    return null;
  }

  try {
    const filterKey = mappedKey as FilterKey;
    const values = getFilteredUniqueValues(filterKey) ?? [];
    const activeFilters = filters[filterKey] || [];

    return (
      <FilterDropdownContent
        column={column}
        filterKey={filterKey}
        values={values as string[]}
        activeFilters={activeFilters}
        updateFilter={updateFilter}
      />
    );
  } catch {
    return null;
  }
};

  // ✅ Componente separado fuera de CanvasRecargosDashboard
  const FilterDropdownContent = ({
    column,
    filterKey,
    values,
    activeFilters,
    updateFilter,
  }: {
    column: Column;
    filterKey: FilterKey;
    values: string[];
    activeFilters: string[];
    updateFilter: (key: FilterKey, value: string) => void;
  }) => {
    const [dropdownSearch, setDropdownSearch] = useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Cierra el dropdown al hacer click fuera
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          // Cierra el filtro para este tipo
          setShowFilters((prev) => ({
            ...prev,
            [filterKey]: false,
          }));
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [filterKey]);

    const filteredValues = useMemo(
      () =>
        dropdownSearch
          ? values.filter((v) =>
            v.toLowerCase().includes(dropdownSearch.toLowerCase()),
          )
          : values,
      [values, dropdownSearch],
    );

    return (
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 max-h-64 overflow-y-auto"
      >
        {/* Header con contador de opciones */}
        <div className="mb-2 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              {column.label}
            </span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {filteredValues.length}
            </span>
          </div>
          <input
            type="text"
            value={dropdownSearch}
            onChange={(e) => setDropdownSearch(e.target.value)}
            placeholder={`Buscar ${column.label.toLowerCase()}...`}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          {filteredValues.length > 0 ? (
            filteredValues.map((value: any) => (
              <label
                key={value}
                className="flex items-center space-x-2 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.includes(value)}
                  onChange={() => updateFilter(filterKey, value)}
                  className="w-3 h-3 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-gray-700 truncate">{value}</span>
              </label>
            ))
          ) : (
            <span className="text-gray-700 truncate">No hay valores</span>
          )}
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const activeFiltersCount = Object.values(filters).flat().length;

  // ✅ Funciones para manejar el modal de edición
  const handleEditRecargo = (recargoId: string) => {
    setModalFormIsOpen(true);
    setRecargoId(recargoId);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-emerald-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              {/* Left section - Logo and title */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Icono mejorado */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BarChart3 size={24} className="text-white sm:w-7 sm:h-7" />
                  {/* Brillo sutil */}
                  <div className="absolute inset-0 bg-white/10 rounded-xl" />
                </div>

                {/* Contenido principal */}
                <div className="min-w-0 flex-1">
                  {/* Título y descripción */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                        Planilla de Recargos
                      </h1>
                      <p className="text-sm text-gray-600 hidden sm:block mt-1">
                        Vista de recargos con filtros dependientes - Los filtros se adaptan automáticamente
                      </p>
                      {activeFiltersCount > 0 && (
                        <p className="text-xs text-emerald-600 mt-1 hidden sm:block">
                          ✨ Filtros activos afectando opciones disponibles
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado de conexión mejorado */}
                  <div className="flex items-center gap-3 mt-3">
                    {/* Indicador visual */}
                    <div className="relative flex items-center">
                      {socketConnected ? (
                        <>
                          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                          <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75" />
                        </>
                      ) : (
                        <div className="w-3 h-3 bg-red-500 rounded-full relative">
                          <div className="absolute inset-0.5 w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Texto de estado */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      {socketConnected ? (
                        <>
                          <span className="text-sm font-medium text-emerald-700">
                            Conectado en tiempo real
                          </span>
                          <span className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
                          <span className="text-sm text-gray-600">
                            {new Date().toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-red-600">
                            Desconectado
                          </span>
                          <span className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
                          <span className="text-sm text-gray-500">
                            Reintentando conexión...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section - Controls */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {/* Date selector - responsive */}
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border border-primary-100 w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Selector de Mes */}
                    <Select
                      aria-label="Seleccionar mes"
                      placeholder="Mes"
                      selectedKeys={[selectedMonth.toString()]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setSelectedMonth(parseInt(selectedKey));
                      }}
                      size="sm"
                      variant="flat"
                      className="min-w-[100px] sm:min-w-[130px]"
                      classNames={{
                        trigger:
                          "border-none bg-transparent shadow-none h-8 min-h-8",
                        value: "text-xs sm:text-sm font-medium text-gray-700",
                        selectorIcon: "text-gray-400",
                      }}
                      startContent={
                        <Calendar size={14} className="text-gray-400" />
                      }
                      renderValue={(items: any) => {
                        const item = items[0];
                        if (item) {
                          const month = months.find(
                            (m) => m.key.toString() === item.key,
                          );
                          return (
                            <span className="text-xs sm:text-sm font-medium">
                              <span className="sm:hidden">{month?.short}</span>
                              <span className="hidden sm:inline">
                                {month?.label}
                              </span>
                            </span>
                          );
                        }
                        return null;
                      }}
                    >
                      {months.map((month) => (
                        <SelectItem key={month.key} textValue={month.label}>
                          <span className="sm:hidden">{month.short}</span>
                          <span className="hidden sm:inline">
                            {month.label}
                          </span>
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Separador */}
                    <span className="text-gray-300 hidden sm:inline">|</span>

                    {/* Selector de Año - Input personalizado */}
                    <div className="relative">
                      <Input
                        type="number"
                        value={selectedYear.toString()}
                        onChange={(e) =>
                          setSelectedYear(Number(e.target.value))
                        }
                        size="sm"
                        variant="flat"
                        startContent={
                          <Clock size={14} className="text-gray-400" />
                        }
                        aria-label="Año"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    onPress={handleOpenFormModal}
                    color="success"
                    variant="flat"
                    radius="sm"
                    startContent={<PlusIcon className="w-5 h-5" />}
                  >
                    Nuevo recargo
                  </Button>
                  <ModalConfiguracion />
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Panel de estadísticas responsive */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            {/* Vista móvil - Cards compactas con las métricas más importantes */}
            <div className="block sm:hidden">
              {/* Resumen principal móvil */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-emerald-700">
                    {statistics.totalRegistros}
                  </div>
                  <div className="text-xs text-emerald-600">Registros</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-700">
                    {formatearCOP(statistics.totalValor)}
                  </div>
                  <div className="text-xs text-green-600">Valor Total</div>
                </div>
              </div>

              {/* Métricas secundarias móvil - 3 columnas */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    {statistics.totalHoras}
                  </div>
                  <div className="text-xs text-gray-500">Horas</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    {statistics.totalDias}
                  </div>
                  <div className="text-xs text-gray-500">Días</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-amber-600">
                    {statistics.empresasActivas}
                  </div>
                  <div className="text-xs text-gray-500">Empresas</div>
                </div>
              </div>
            </div>

            {/* Vista tablet - Grid responsive */}
            <div className="hidden sm:block md:hidden">
              <div className="grid grid-cols-4 gap-4">
                {/* Fila principal */}
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600">
                    {statistics.totalRegistros}
                  </div>
                  <div className="text-xs text-gray-500">Registros</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600">
                    {statistics.totalHoras}
                  </div>
                  <div className="text-xs text-gray-500">Horas Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">
                    {statistics.empresasActivas}
                  </div>
                  <div className="text-xs text-gray-500">Empresas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatearCOP(statistics.totalValor)}
                  </div>
                  <div className="text-xs text-gray-500">Valor Total</div>
                </div>
              </div>

              {/* Segunda fila tablet */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {statistics.totalHED}
                  </div>
                  <div className="text-xs text-gray-500">HE Diurnas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {statistics.totalHEN}
                  </div>
                  <div className="text-xs text-gray-500">HE Nocturnas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {statistics.totalRN}
                  </div>
                  <div className="text-xs text-gray-500">RE Nocturnas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {statistics.totalRD}
                  </div>
                  <div className="text-xs text-gray-500">RE Dominical</div>
                </div>
              </div>
            </div>

            {/* Vista desktop - Grid completo */}
            <div className="hidden md:block">
              {/* Laptop/Desktop pequeño */}
              <div className="hidden md:block lg:hidden">
                <div className="grid grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-600">
                      {statistics.totalRegistros}
                    </div>
                    <div className="text-xs text-gray-500">Registros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-600">
                      {statistics.totalHoras}
                    </div>
                    <div className="text-xs text-gray-500">Horas Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {statistics.totalHED}
                    </div>
                    <div className="text-xs text-gray-500">HE Diurnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {statistics.totalHEN}
                    </div>
                    <div className="text-xs text-gray-500">HE Nocturnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">
                      {statistics.empresasActivas}
                    </div>
                    <div className="text-xs text-gray-500">Empresas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {formatearCOP(statistics.totalValor)}
                    </div>
                    <div className="text-xs text-gray-500">Valor Total</div>
                  </div>
                </div>

                {/* Segunda fila para laptop */}
                <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {statistics.totalHEFD}
                    </div>
                    <div className="text-xs text-gray-500">HEF Diurna</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">
                      {statistics.totalHEFN}
                    </div>
                    <div className="text-xs text-gray-500">HEF Nocturna</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {statistics.totalRN}
                    </div>
                    <div className="text-xs text-gray-500">RE Nocturnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {statistics.totalRD}
                    </div>
                    <div className="text-xs text-gray-500">RE Dominical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {statistics.totalDias}
                    </div>
                    <div className="text-xs text-gray-500">Días Totales</div>
                  </div>
                </div>
              </div>

              {/* Desktop grande - Vista completa original */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-11 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {statistics.totalRegistros}
                    </div>
                    <div className="text-xs text-gray-500">Registros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {statistics.totalDias}
                    </div>
                    <div className="text-xs text-gray-500">Días Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {statistics.totalHoras}
                    </div>
                    <div className="text-xs text-gray-500">Horas Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalHED}
                    </div>
                    <div className="text-xs text-gray-500">HE Diurnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {statistics.totalHEN}
                    </div>
                    <div className="text-xs text-gray-500">HE Nocturnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {statistics.totalHEFD}
                    </div>
                    <div className="text-xs text-gray-500">HEF Diurna</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {statistics.totalHEFN}
                    </div>
                    <div className="text-xs text-gray-500">HEF Nocturna</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {statistics.totalRN}
                    </div>
                    <div className="text-xs text-gray-500">RE Nocturnas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {statistics.totalRD}
                    </div>
                    <div className="text-xs text-gray-500">RE Dominical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {statistics.empresasActivas}
                    </div>
                    <div className="text-xs text-gray-500">Empresas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatearCOP(statistics.totalValor)}
                    </div>
                    <div className="text-xs text-gray-500">Valor Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de herramientas responsive */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3">
            {/* Vista móvil */}
            <div className="block md:hidden space-y-3">
              {/* Búsqueda móvil - ancho completo */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Elementos seleccionados móvil */}
              {selectedRows.size > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-emerald-700 font-medium">
                    {selectedRows.size} seleccionado
                    {selectedRows.size > 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      onPress={handleEliminar}
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<Trash2 size={12} />}
                      className="text-xs px-2 py-1"
                    >
                      Eliminar
                    </Button>
                    <Button
                      onPress={handleLiquidar}
                      color="warning"
                      variant="flat"
                      size="sm"
                      startContent={<Copy size={12} />}
                    >
                      Liquidado
                    </Button>
                    <Button
                      onPress={handleCopySelectedRows}
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<Copy size={12} />}
                      className={`text-xs px-2 py-1 ${copiedRowId ? "bg-emerald-100 text-emerald-700" : ""}`}
                    >
                      {copiedRowId ? "Copiado!" : "Copiar"}
                    </Button>
                    <button
                      onClick={() => setSelectedRows(new Set())}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Fila inferior móvil */}
              <div className="flex items-center justify-between">
                {/* Filtros activos móvil */}
                <div className="flex items-center space-x-2">
                  {activeFiltersCount > 0 && (
                    <>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                        {activeFiltersCount} filtros
                      </span>
                      <Button
                        onPress={clearAllFilters}
                        variant="light"
                        size="sm"
                        className="text-xs text-red-600 px-2 py-1"
                      >
                        Limpiar
                      </Button>
                    </>
                  )}
                </div>

                {/* Paginación compacta móvil */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 text-xs">
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, processedData.length)}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-1 py-1 text-xs bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vista tablet y desktop */}
            <div className="hidden md:block">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-3 lg:space-y-0">
                {/* Sección izquierda */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                  {/* Búsqueda global */}
                  <div className="relative w-full sm:w-auto">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar en todos los campos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Indicadores de filtros activos */}
                  {activeFiltersCount > 0 && (
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        Filtros activos:
                      </span>
                        <>
                        {(() => {
                          const keys: FilterKey[] = ["conductores", "empresas", "estados", "planillas", "placas"];
                          const activeGroupsCount = keys.reduce((acc, key) => {
                          const isActive = !!showFilters[key] || (filters[key]?.length ?? 0) > 0;
                          return acc + (isActive ? 1 : 0);
                          }, 0);

                          return (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                            {activeGroupsCount}
                          </span>
                          );
                        })()}
                        </>
                      <Button
                        onPress={clearAllFilters}
                        variant="light"
                        color="danger"
                        size="sm"
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sección derecha */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 w-full lg:w-auto">
                  {/* Información de registros */}
                  <div className="flex items-center space-x-3 text-sm">
                    {selectedRows.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-emerald-600 font-medium">
                          {selectedRows.size} elementos seleccionados
                        </span>

                        <Button
                          onPress={handleLiquidar}
                          color="warning"
                          variant="flat"
                          size="sm"
                          startContent={<Copy size={12} />}
                        >
                          Liquidado
                        </Button>

                        <Button
                          onPress={handleCopySelectedRows}
                          color="primary"
                          variant="flat"
                          size="sm"
                          startContent={<Copy size={12} />}
                          className={`text-xs px-2 py-1 ${copiedRowId ? "bg-emerald-100 text-emerald-700" : ""}`}
                        >
                          {copiedRowId ? "Copiado!" : "Copiar"}
                        </Button>

                        {/* Botón de eliminación masiva */}
                        <Button
                          onPress={handleEliminar}
                          color="danger"
                          variant="flat"
                          size="sm"
                          startContent={<Trash2 size={14} />}
                          className="text-xs"
                        >
                          Eliminar seleccionados
                        </Button>

                        <Button
                          variant="light"
                          onPress={() => setSelectedRows(new Set())}
                          className="text-xs text-gray-600 hover:text-gray-800 underline"
                        >
                          Deseleccionar todo
                        </Button>
                      </div>
                    )}

                    <span className="text-gray-600 whitespace-nowrap">
                      {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(
                        currentPage * itemsPerPage,
                        processedData.length,
                      )}{" "}
                      de {processedData.length.toLocaleString()}
                    </span>

                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500 text-xs">Ver:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Canvas */}
        <div className="flex-1 overflow-auto bg-white min-h-96">
          <div className="relative">
            {/* Headers */}
            <div className="sticky top-0 z-10 bg-gray-50">
              <div className="flex">
                {columns.map((column: Column) => {
                  // Determinar el estilo del header según el tipo de columna
                  let headerClass =
                    "relative border-r border-gray-300 bg-gray-50"; // Centrado vertical

                  if (column.fixed) {
                    headerClass =
                      "relative border-r border-gray-300 bg-gray-100 border-b-2 border-gray-300  flex items-center justify-center";
                  } else if (column.isDayColumn) {
                    if (column.isSunday && column.isHoliday) {
                      headerClass =
                        "relative border-r border-gray-300 bg-amber-600 text-white flex items-center justify-center";
                    } else if (column.isSunday) {
                      headerClass =
                        "relative border-r border-gray-300 bg-emerald-600 text-white flex items-center justify-center";
                    } else if (column.isHoliday) {
                      headerClass =
                        "relative border-r border-gray-300 bg-red-500 text-white flex items-center justify-center";
                    } else {
                      headerClass =
                        "relative border-r border-gray-300 bg-emerald-50 border-b-2 border-gray-300 flex items-center justify-center";
                    }
                  } else if (column.isSummary) {
                    headerClass =
                      "relative border-r border-gray-300 bg-green-50 border-b-2 border-gray-300 flex items-center justify-center";
                  }

                  return (
                    <div
                      key={column.key}
                      className={headerClass}
                      style={{
                        width: column.width,
                        minWidth: column.width,
                      }}
                    >
                      <div className="p-2 flex items-center justify-between">
                        <div
                          className={`flex-1 text-xs font-bold flex items-center justify-${column.align === "center"
                            ? "center"
                            : column.align === "right"
                              ? "end"
                              : "start"
                            } ${column.isSunday || column.isHoliday
                              ? "text-white"
                              : "text-gray-700"
                            }`}
                          style={{ height: "100%" }}
                        >
                          <div className="whitespace-pre-line leading-tight">
                            {column.isDayColumn ? (
                              <div className="text-center">
                                <div className="font-bold">{column.label}</div>
                                {column.isSunday && (
                                  <div className="text-xs opacity-90">DOM</div>
                                )}
                                {column.isHoliday && (
                                  <div className="text-xs opacity-90">FES</div>
                                )}
                              </div>
                            ) : (
                              column.label
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-1">
                          {/* Sort button */}
                          {column.sortable && (
                            <button
                              onClick={() => handleSort(column.key)}
                              className={`p-1 hover:bg-gray-200 rounded transition-colors ${column.isSunday || column.isHoliday
                                ? "hover:bg-white/20"
                                : ""
                                }`}
                            >
                              <ArrowUpDown
                                size={10}
                                className={`cursor-pointer ${sortField === column.key
                                  ? "text-emerald-600"
                                  : column.isSunday || column.isHoliday
                                    ? "text-white"
                                    : "text-gray-400"
                                  }`}
                              />
                            </button>
                          )}

                          {/* Filter button - solo para columnas específicas */}
                          {column.filterable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // ⭐ IMPORTANTE: evita que el click se propague
                                const filterKey = getFilterKey(column.key);
                                toggleFilter(filterKey);
                              }}
                              className={`cursor-pointer p-1 hover:bg-gray-200 rounded transition-colors ${
                                // Mostrar como activo si tiene filtros aplicados O si está abierto
                                filters[getFilterKey(column.key)]?.length > 0 || showFilters[getFilterKey(column.key)]
                                  ? "text-emerald-600 bg-emerald-50"
                                  : column.isSunday || column.isHoliday
                                    ? "text-white hover:bg-white/20"
                                    : "text-gray-400"
                              }`}
                              title={showFilters[getFilterKey(column.key)] ? "Cerrar filtro" : "Abrir filtro"}
                            >
                              <Filter size={10} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown de filtro */}
                      {renderFilterDropdown(column)}
                    </div>
                  );
                })}
              </div>

              {/* Header de selección múltiple */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.size === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Filas de datos con columnas de días */}
          <div>
            {paginatedData.map((item) => {
              // Calcular el ancho total de todas las columnas
              const totalWidth = columns.reduce((sum, col) => {
                const width = parseInt(col.width.replace("px", ""));
                return sum + width;
              }, 0);

              return (
                <div
                  key={item.id}
                  className={`flex relative ${selectedRows.has(item.id) ? "opacity-70" : ""}`}
                  style={{ width: `${totalWidth}px` }}
                >
                  <div
                    className="absolute left-0 bottom-0 h-[2px] bg-gray-300 opacity-60"
                    style={{ width: `${totalWidth}px`, zIndex: 1 }}
                  />

                  {/* Mask overlay que cubre toda la fila */}
                  {selectedRows.has(item.id) && (
                    <div
                      className="absolute top-0 left-0 h-full bg-primary-500/10 z-50 pointer-events-none"
                      style={{
                        width: `${totalWidth}px`,
                        backgroundImage:
                          "linear-gradient(135deg, transparent, rgba(102, 178, 250, 0.1), transparent)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  )}

                  {columns.map((column: Column) => {
                    // Tu código existente para las celdas...
                    let cellClass =
                      "border-r border-gray-200 p-2 flex items-center";

                    if (column.fixed) {
                      cellClass += " bg-slate-50";
                    } else if (column.isDayColumn) {
                      const hasHours = getItemValue(item, column.key) > 0;
                      if (column.isSunday && column.isHoliday) {
                        cellClass += hasHours
                          ? " bg-amber-100"
                          : " bg-amber-50";
                      } else if (column.isSunday) {
                        cellClass += hasHours
                          ? " bg-emerald-100"
                          : " bg-emerald-50";
                      } else if (column.isHoliday) {
                        cellClass += hasHours ? " bg-red-100" : " bg-red-50";
                      } else {
                        cellClass += hasHours ? " bg-green-50" : " bg-gray-50";
                      }
                    } else if (column.isSummary) {
                      cellClass += " bg-green-25";
                    }

                    return (
                      <div
                        key={`${item.id}-${column.key}`}
                        className={cellClass}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          justifyContent:
                            column.align === "center"
                              ? "center"
                              : column.align === "right"
                                ? "flex-end"
                                : "flex-start",
                        }}
                      >
                        {renderCell(item, column as Column)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Estado vacío mejorado */}
          {paginatedData.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron registros
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || activeFiltersCount > 0
                    ? "Intenta ajustar los filtros o términos de búsqueda"
                    : "No hay datos disponibles para este período"}
                </p>
                {(searchTerm || activeFiltersCount > 0) && (
                  <Button
                    onPress={clearAllFilters}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con paginación y información adicional - Responsive */}
        <div className="bg-white border-t border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Vista móvil */}
            <div className="block sm:hidden">
              {/* Información de registros centrada */}
              <div className="text-center mb-3">
                <span className="text-sm text-gray-600">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, processedData.length)}{" "}
                  de {processedData.length}
                </span>
              </div>

              {/* Controles de paginación móvil */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Página</span>
                  <span className="px-2 py-1 text-sm font-medium bg-emerald-100 text-emerald-800 rounded">
                    {currentPage}
                  </span>
                  <span className="text-sm text-gray-500">de {totalPages}</span>
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Información del período en móvil */}
              <div className="text-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
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
                    ][selectedMonth - 1]
                  }{" "}
                  {selectedYear} • {getDaysInMonth(selectedMonth, selectedYear)}{" "}
                  días
                </span>
              </div>
            </div>

            {/* Vista tablet y desktop */}
            <div className="hidden sm:block">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                {/* Información izquierda */}
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <span className="text-sm text-gray-600">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, processedData.length)}{" "}
                    de {processedData.length} registros
                  </span>
                </div>

                {/* Controles de paginación desktop */}
                <div className="flex items-center space-x-2">
                  {/* Navegación rápida */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Primera página"
                  >
                    Primera
                  </button>

                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Números de página */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${currentPage === pageNum
                            ? "bg-emerald-600 text-white font-medium"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="min-w-[2.5rem] px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Última página"
                  >
                    Última
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalFormRecargo
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        recargoId={recargoId}
        isOpen={modalFormIsOpen}
        onClose={handleOpenFormModal}
      />
      <ModalVisualizarRecargo
        recargoId={viewModalState.recargoId}
        isOpen={viewModalState.isOpen}
        onClose={() => setViewModalState({ isOpen: false, recargoId: null })}
      />
      {EliminarDialog}
      {LiquidarDialog}
    </>
  );
};

export default CanvasRecargosDashboard;
