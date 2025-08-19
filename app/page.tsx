"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Building,
  Car,
  Eye,
  Download,
  Plus,
  X,
  ChevronDown,
  BarChart3,
  Settings,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import ModalNewRecargo from '@/components/ui/modalNewRecargo';

const CanvasRecargosDashboard = () => {
  // Estados principales
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('conductor');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Estados de filtros
  const [filters, setFilters] = useState({
    empresas: [],
    estados: [],
    planillas: [],
    placas: []
  });

  // Estados de visibilidad de filtros
  const [showFilters, setShowFilters] = useState({
    empresas: false,
    estados: false,
    planillas: false,
    placas: false
  });


  // Función para obtener días del mes seleccionado
  const getDaysInMonth = useCallback((month, year) => {
    return new Date(year, month, 0).getDate();
  }, []);


  // Función para verificar si un día es domingo
  const isSunday = useCallback((day, month, year) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0;
  }, []);


  // Función para verificar si un día es festivo (simulado)
  const isHoliday = useCallback((day, month, year) => {
    // Simulamos algunos días festivos
    const holidays = [
      { month: 1, day: 1 },   // Año nuevo
      { month: 5, day: 1 },   // Día del trabajo
      { month: 7, day: 20 },  // Día de la independencia
      { month: 12, day: 25 }, // Navidad
    ];
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  }, []);

  // Datos simulados ampliados con días laborales
  const mockData = useMemo(() => {
    const conductores = [
      "Juan Carlos Rodríguez", "María Elena González", "Carlos Alberto Mendoza",
      "Ana Patricia López", "Luis Fernando Vargas", "Carmen Rosa Herrera",
      "José Miguel Torres", "Sandra Milena Castro", "Diego Alejandro Ruiz",
      "Claudia Patricia Morales", "Roberto Carlos Jiménez", "Liliana Marcela Pérez"
    ];

    const empresas = [
      "TransCarga S.A.S", "Logística del Norte", "Express Delivery",
      "Carga Rápida Ltda", "Transportes Unidos", "MoviCarga Express"
    ];

    const estados = ["activo", "revision", "pendiente", "aprobado"];
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

    return Array.from({ length: 50 }, (_, i) => {
      const conductor = conductores[i % conductores.length];
      const [nombre, ...apellidos] = conductor.split(' ');
      const apellido = apellidos.join(' ');

      // Generar datos por día del mes
      const diasLaborales = {};
      let totalHoras = 0;
      let diasTrabajados = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const isSundayDay = isSunday(day, selectedMonth, selectedYear);
        const isHolidayDay = isHoliday(day, selectedMonth, selectedYear);

        // Probabilidad de trabajar (menor en domingos/festivos)
        const trabajaHoy = Math.random() > (isSundayDay || isHolidayDay ? 0.7 : 0.2);

        if (trabajaHoy) {
          const horasDelDia = 6 + Math.floor(Math.random() * 6); // 6-12 horas
          diasLaborales[`day_${day}`] = horasDelDia;
          totalHoras += horasDelDia;
          diasTrabajados++;
        } else {
          diasLaborales[`day_${day}`] = 0;
        }
      }

      return {
        id: i + 1,
        conductor: {
          nombre,
          apellido,
          cedula: `${12345678 + i}`,
          fullName: conductor
        },
        empresa: {
          nombre: empresas[i % empresas.length],
          id: (i % empresas.length) + 1
        },
        vehiculo: { placa: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + ((i + 1) % 26))}${String.fromCharCode(67 + ((i + 2) % 26))}${(123 + i).toString().slice(-3)}` },
        numero_planilla: `PL-2025-${(i + 1).toString().padStart(3, '0')}`,
        total_horas_trabajadas: totalHoras,
        total_hed: Math.floor(Math.random() * 30),
        total_hen: Math.floor(Math.random() * 25),
        total_hefd: Math.floor(Math.random() * 15),
        total_hefn: Math.floor(Math.random() * 20),
        total_rn: Math.floor(Math.random() * 40),
        total_rd: Math.floor(Math.random() * 20),
        estado: estados[i % estados.length],
        dias_laborales: diasTrabajados,
        valor_total: 1800000 + Math.floor(Math.random() * 800000),
        fecha_creacion: new Date(2025, selectedMonth - 1, Math.floor(Math.random() * 28) + 1),
        promedio_diario: diasTrabajados > 0 ? (totalHoras / diasTrabajados).toFixed(1) : "0",
        ...diasLaborales // Incluir las horas por día
      };
    });
  }, [selectedMonth, selectedYear, getDaysInMonth, isSunday, isHoliday]);

  // Configuración de columnas dinámicas
  const columns = useMemo(() => {
    const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);

    const baseColumns = [
      {
        key: 'select',
        label: '',
        width: '50px',
        sortable: false,
        filterable: false,
        fixed: true
      },
      {
        key: 'conductor',
        label: 'CONDUCTOR',
        width: '250px',
        sortable: true,
        filterable: true,
        align: 'left',
        fixed: true
      },
      {
        key: 'empresa',
        label: 'EMPRESA',
        width: '200px',
        sortable: true,
        filterable: true,
        align: 'left',
        fixed: true
      },
      {
        key: 'numero_planilla',
        label: 'PLANILLA',
        width: '120px',
        sortable: true,
        filterable: true,
        align: 'center',
        fixed: true
      },
      {
        key: 'vehiculo',
        label: 'PLACA',
        width: '100px',
        sortable: true,
        filterable: true,
        align: 'center',
        fixed: true
      }
    ];

    // Generar columnas para cada día del mes
    const dayColumns = Array.from({ length: daysInCurrentMonth }, (_, i) => {
      const day = i + 1;
      const isSundayDay = isSunday(day, selectedMonth, selectedYear);
      const isHolidayDay = isHoliday(day, selectedMonth, selectedYear);

      return {
        key: `day_${day}`,
        label: day.toString(),
        width: '55px',
        sortable: true,
        align: 'center',
        isDayColumn: true,
        isSunday: isSundayDay,
        isHoliday: isHolidayDay,
        day: day
      };
    });

    const summaryColumns = [
      {
        key: 'total_horas_trabajadas',
        label: 'TOTAL\nHORAS',
        width: '80px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'promedio_diario',
        label: 'PROM.\nDIARIO',
        width: '80px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_hed',
        label: 'HED\n(25%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_hen',
        label: 'HEN\n(75%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_hefd',
        label: 'HEFD\n(100%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_hefn',
        label: 'HEFN\n(150%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_rn',
        label: 'RN\n(35%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'total_rd',
        label: 'RD\n(75%)',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'dias_laborales',
        label: 'DÍAS\nLAB.',
        width: '70px',
        sortable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'valor_total',
        label: 'VALOR TOTAL',
        width: '130px',
        sortable: true,
        align: 'right',
        isSummary: true
      },
      {
        key: 'estado',
        label: 'ESTADO',
        width: '100px',
        sortable: true,
        filterable: true,
        align: 'center',
        isSummary: true
      },
      {
        key: 'acciones',
        label: 'ACCIONES',
        width: '100px',
        sortable: false,
        align: 'center',
        isSummary: true
      }
    ];

    return [...baseColumns, ...dayColumns, ...summaryColumns];
  }, [selectedMonth, selectedYear, getDaysInMonth, isSunday, isHoliday]);

  // Obtener valores únicos para filtros
  const getUniqueValues = useCallback((field) => {
    const values = new Set();
    mockData.forEach(item => {
      let value = '';
      switch (field) {
        case 'empresas':
          value = item.empresa.nombre;
          break;
        case 'estados':
          value = item.estado;
          break;
        case 'planillas':
          value = item.numero_planilla;
          break;
        case 'placas':
          value = item.vehiculo.placa;
          break;
      }
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  }, [mockData]);

  // Datos filtrados y ordenados
  const processedData = useMemo(() => {
    let result = [...mockData];

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(item =>
        item.conductor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.conductor.cedula.includes(searchTerm) ||
        item.empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_planilla.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.empresas.length > 0) {
      result = result.filter(item => filters.empresas.includes(item.empresa.nombre));
    }
    if (filters.estados.length > 0) {
      result = result.filter(item => filters.estados.includes(item.estado));
    }
    if (filters.planillas.length > 0) {
      result = result.filter(item => filters.planillas.includes(item.numero_planilla));
    }
    if (filters.placas.length > 0) {
      result = result.filter(item => filters.placas.includes(item.vehiculo.placa));
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'conductor':
          aValue = a.conductor.fullName;
          bValue = b.conductor.fullName;
          break;
        case 'empresa':
          aValue = a.empresa.nombre;
          bValue = b.empresa.nombre;
          break;
        case 'vehiculo':
          aValue = a.vehiculo.placa;
          bValue = b.vehiculo.placa;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return result;
  }, [mockData, searchTerm, filters, sortField, sortDirection]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Estadísticas
  const statistics = useMemo(() => {
    const totalHoras = processedData.reduce((acc, item) => acc + item.total_horas_trabajadas, 0);
    const totalValor = processedData.reduce((acc, item) => acc + item.valor_total, 0);
    const totalHED = processedData.reduce((acc, item) => acc + item.total_hed, 0);
    const totalHEN = processedData.reduce((acc, item) => acc + item.total_hen, 0);

    return {
      totalRegistros: processedData.length,
      totalHoras,
      totalValor,
      totalHED,
      totalHEN,
      promedioHoras: processedData.length > 0 ? (totalHoras / processedData.length).toFixed(1) : 0,
      empresasActivas: new Set(processedData.map(item => item.empresa.nombre)).size
    };
  }, [processedData]);

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectRow = (id) => {
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
      setSelectedRows(new Set(paginatedData.map(item => item.id)));
    }
  };

  const toggleFilter = (type) => {
    setShowFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const updateFilter = (type, value) => {
    setFilters(prev => {
      const currentValues = prev[type];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return { ...prev, [type]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({ empresas: [], estados: [], planillas: [], placas: [] });
    setSearchTerm('');
  };

  const renderCell = (item, column) => {
    switch (column.key) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={selectedRows.has(item.id)}
            onChange={() => handleSelectRow(item.id)}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
        );

      case 'conductor':
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {item.conductor.nombre.charAt(0)}{item.conductor.apellido.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">{item.conductor.fullName}</div>
              <div className="text-xs text-gray-500">{item.conductor.cedula}</div>
            </div>
          </div>
        );

      case 'empresa':
        return (
          <div className="text-sm text-gray-900">{item.empresa.nombre}</div>
        );

      case 'vehiculo':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
            {item.vehiculo.placa}
          </span>
        );

      case 'valor_total':
        return (
          <span className="font-semibold text-green-600">
            ${item.valor_total.toLocaleString()}
          </span>
        );

      case 'estado':
        const statusColors = {
          activo: 'bg-green-100 text-green-800',
          revision: 'bg-yellow-100 text-yellow-800',
          pendiente: 'bg-red-100 text-red-800',
          aprobado: 'bg-emerald-100 text-emerald-800'
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.estado]}`}>
            {item.estado.toUpperCase()}
          </span>
        );

      case 'acciones':
        return (
          <div className="flex items-center justify-center space-x-1">
            <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
              <Eye size={14} />
            </button>
            <button className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <Download size={14} />
            </button>
            <button className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        );

      default:
        // Manejo de columnas de días y otras columnas numéricas
        if (column.isDayColumn) {
          const horasDelDia = item[column.key] || 0;
          const hasHours = horasDelDia > 0;

          return (
            <div className={`text-sm font-medium ${hasHours
              ? 'text-emerald-900 bg-emerald-50 px-2 py-1 rounded'
              : 'text-gray-400'
              }`}>
              {hasHours ? horasDelDia : '-'}
            </div>
          );
        }

        return (
          <span className="text-sm text-gray-900">
            {item[column.key] || '0'}
          </span>
        );
    }
  };

  const renderFilterDropdown = (column) => {
    if (!column.filterable) return null;

    const filterKey = {
      'conductor': 'conductores',
      'empresa': 'empresas',
      'numero_planilla': 'planillas',
      'vehiculo': 'placas',
      'estado': 'estados'
    }[column.key];

    if (!filterKey || !showFilters[filterKey]) return null;

    const values = getUniqueValues(filterKey);
    const activeFilters = filters[filterKey] || [];

    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 max-h-48 overflow-y-auto">
        <div className="space-y-2">
          {values.map(value => (
            <label key={value} className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={activeFilters.includes(value)}
                onChange={() => updateFilter(filterKey, value)}
                className="w-3 h-3 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-gray-700 truncate">{value}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const activeFiltersCount = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Planilla de Recargos - Canvas View</h1>
                <p className="text-sm text-gray-500">Vista de tabla avanzada con filtros inteligentes</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Selector de mes/año */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border">
                <Calendar size={16} className="text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border-none bg-transparent text-sm font-medium focus:outline-none"
                >
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border-none bg-transparent text-sm font-medium focus:outline-none"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
              <ModalNewRecargo currentMonth={selectedMonth} currentYear={selectedYear}/>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de estadísticas compacto */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="grid grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{statistics.totalRegistros}</div>
              <div className="text-xs text-gray-500">Registros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.totalHoras}</div>
              <div className="text-xs text-gray-500">Horas Totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.totalHED}</div>
              <div className="text-xs text-gray-500">HE Diurnas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{statistics.totalHEN}</div>
              <div className="text-xs text-gray-500">HE Nocturnas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{statistics.empresasActivas}</div>
              <div className="text-xs text-gray-500">Empresas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${(statistics.totalValor / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-gray-500">Valor Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Búsqueda global */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en todos los campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Indicadores de filtros activos */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filtros activos:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    {activeFiltersCount}
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Limpiar todos
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Selección múltiple */}
              {selectedRows.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedRows.size} seleccionados
                </span>
              )}

              {/* Paginación compacta */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
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

      {/* Tabla Canvas */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="relative">
          {/* Headers */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-300">
            <div className="flex">
              {columns.map((column, index) => {
                // Determinar el estilo del header según el tipo de columna
                let headerClass = "relative border-r border-gray-300 bg-gray-50";

                if (column.fixed) {
                  headerClass = "relative border-r border-gray-300 bg-slate-100";
                } else if (column.isDayColumn) {
                  if (column.isSunday) {
                    headerClass = "relative border-r border-gray-300 bg-emerald-600 text-white";
                  } else if (column.isHoliday) {
                    headerClass = "relative border-r border-gray-300 bg-red-500 text-white";
                  } else {
                    headerClass = "relative border-r border-gray-300 bg-emerald-50";
                  }
                } else if (column.isSummary) {
                  headerClass = "relative border-r border-gray-300 bg-green-50";
                }

                return (
                  <div
                    key={column.key}
                    className={headerClass}
                    style={{
                      width: column.width,
                      minWidth: column.width
                    }}
                  >
                    <div className="p-2 flex items-center justify-between">
                      <div className={`flex-1 text-xs font-bold ${column.isSunday || column.isHoliday ? 'text-white' : 'text-gray-700'
                        } ${column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}>
                        <div className="whitespace-pre-line leading-tight">
                          {column.isDayColumn ? (
                            <div className="text-center">
                              <div className="font-bold">{column.label}</div>
                              {column.isSunday && <div className="text-xs opacity-90">DOM</div>}
                              {column.isHoliday && <div className="text-xs opacity-90">FES</div>}
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
                            className={`p-1 hover:bg-gray-200 rounded transition-colors ${column.isSunday || column.isHoliday ? 'hover:bg-white/20' : ''
                              }`}
                          >
                            <ArrowUpDown size={10} className={`${sortField === column.key ? 'text-emerald-600' :
                              column.isSunday || column.isHoliday ? 'text-white' : 'text-gray-400'
                              }`} />
                          </button>
                        )}

                        {/* Filter button - solo para columnas específicas */}
                        {column.filterable && (
                          <button
                            onClick={() => toggleFilter(
                              column.key === 'conductor' ? 'conductores' :
                                column.key === 'empresa' ? 'empresas' :
                                  column.key === 'numero_planilla' ? 'planillas' :
                                    column.key === 'vehiculo' ? 'placas' : 'estados'
                            )}
                            className={`p-1 hover:bg-gray-200 rounded transition-colors ${filters[
                              column.key === 'conductor' ? 'conductores' :
                                column.key === 'empresa' ? 'empresas' :
                                  column.key === 'numero_planilla' ? 'planillas' :
                                    column.key === 'vehiculo' ? 'placas' : 'estados'
                            ]?.length > 0 ? 'text-emerald-600' : 'text-gray-400'
                              }`}
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
                checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
            </div>
          </div>
    
          {/* Header de selección múltiple */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <input
              type="checkbox"
              checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filas de datos con columnas de días */}
        <div className="divide-y divide-gray-200">
          {paginatedData.map((item, rowIndex) => (
            <div
              key={item.id}
              className={`flex hover:bg-emerald-50 transition-colors ${selectedRows.has(item.id) ? 'bg-emerald-50' : ''
                } ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {columns.map((column) => {
                // Determinar el estilo de la celda según el tipo de columna
                let cellClass = "border-r border-gray-200 p-2 flex items-center";

                if (column.fixed) {
                  cellClass += " bg-slate-50";
                } else if (column.isDayColumn) {
                  const hasHours = item[column.key] > 0;
                  if (column.isSunday) {
                    cellClass += hasHours ? " bg-emerald-100" : " bg-emerald-50";
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
                      justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {renderCell(item, column)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Estado vacío mejorado */}
        {paginatedData.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron registros</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || activeFiltersCount > 0
                  ? "Intenta ajustar los filtros o términos de búsqueda"
                  : "No hay datos disponibles para este período"}
              </p>
              {(searchTerm || activeFiltersCount > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer con paginación y información adicional */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} registros
              </span>

              <div className="text-sm text-gray-500">
                Mes: {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth - 1]} {selectedYear}
                ({getDaysInMonth(selectedMonth, selectedYear)} días)
              </div>

              {selectedRows.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-emerald-600 font-medium">
                    {selectedRows.size} elementos seleccionados
                  </span>
                  <button
                    onClick={() => setSelectedRows(new Set())}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                  >
                    Deseleccionar todo
                  </button>
                </div>
              )}
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

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
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${currentPage === pageNum
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                      className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasRecargosDashboard;