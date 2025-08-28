"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AxiosError, isAxiosError } from "axios";
import { Conductor, Empresa, Vehiculo } from "@/types";
import { apiClient } from "@/config/apiClient";
import { obtenerFestivosCompletos } from "@/helpers";

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

// ✅ NUEVAS INTERFACES PARA TIPOS DE RECARGO
interface TipoRecargo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  porcentaje: number; // Viene como string del backend
  adicional: boolean;
  es_valor_fijo: boolean;
  valor_fijo: number | null;
  aplica_festivos: boolean | null;
  aplica_domingos: boolean | null;
  aplica_nocturno: boolean | null;
  aplica_diurno: boolean | null;
  orden_calculo: number;
  es_hora_extra: boolean;
  requiere_horas_extras: boolean;
  limite_horas_diarias: number | null;
  activo: boolean;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TiposRecargoData {
  data: TipoRecargo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata?: {
    filtros_aplicados: Record<string, any>;
    ordenamiento: {
      campo: string;
      direccion: string;
    };
  };
}

// ✅ NUEVAS INTERFACES PARA CONFIGURACIÓN DE SALARIOS
interface ConfiguracionSalario {
  id: string;
  empresa_id: string | null;
  salario_basico: number; // Viene como number del backend
  valor_hora_trabajador: number; // Viene como number del backend
  horas_mensuales_base: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  activo: boolean;
  observaciones: string | null;
  creado_por_id: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  empresa: Empresa | null;
}

interface ConfiguracionesSalarioData {
  data: ConfiguracionSalario[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Filtros para tipos de recargo
interface FiltrosTipoRecargo {
  categoria?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  ordenar_por?: string;
  orden?: "ASC" | "DESC";
}

// Filtros para configuración de salario
interface FiltrosConfigSalario {
  empresa_id?: string;
  activo?: boolean;
  vigente?: boolean;
  page?: number;
  limit?: number;
}

export interface RecargoDetallado {
  id: string;
  planilla: string | null;
  conductor: Conductor;
  vehiculo: Vehiculo;
  empresa: Empresa;
  total_horas: number;
  total_dias: number;
  total_hed: number;
  total_hen: number;
  total_hefd: number;
  total_hefn: number;
  total_rn: number;
  total_rd: number;
  dias_laborales: DiaLaboral[];
}

export interface RecargoResponse {
  success: boolean;
  data: {
    mes: number;
    año: number;
    total_recargos: number;
    recargo: RecargoDetallado;
  };
  message: string;
}

export interface DiaLaboralPlanilla {
  /** Identificador único del día laboral */
  id: string;

  /** ID del recargo planilla al que pertenece este día */
  recargo_planilla_id: string;

  /** Día del mes (1-31) */
  dia: number;

  /** Hora de inicio en formato decimal (ej: 8.5 = 8:30) */
  hora_inicio: number;

  /** Hora de fin en formato decimal (ej: 17.5 = 17:30) */
  hora_fin: number;

  /** Total de horas trabajadas en el día */
  total_horas: number;

  /** Horas Extra Diurnas del día (25%) */
  hed: number;

  /** Horas Extra Nocturnas del día (75%) */
  hen: number;

  /** Horas Extra Festivas Diurnas del día (100%) */
  hefd: number;

  /** Horas Extra Festivas Nocturnas del día (150%) */
  hefn: number;

  /** Recargo Nocturno del día (35%) */
  rn: number;

  /** Recargo Dominical del día (75%) */
  rd: number;

  /** Indica si el día es festivo */
  es_festivo: boolean;

  /** Indica si el día es domingo */
  es_domingo: boolean;

  /** Observaciones específicas del día */
  observaciones?: string | null;

  /** ID del usuario que creó el registro */
  creado_por_id?: string | null;

  /** ID del usuario que actualizó el registro por última vez */
  actualizado_por_id?: string | null;

  /** Fecha y hora de creación del registro */
  created_at: string;

  /** Fecha y hora de última actualización del registro */
  updated_at: string;

  /** Fecha y hora de eliminación lógica (soft delete) */
  deleted_at?: string | null;
}

// Datos optimizados para canvas
export interface CanvasRecargo {
  id: string;
  planilla: string;
  conductor: Conductor;
  vehiculo: Vehiculo;
  empresa: Empresa;
  numero_planilla: string;
  total_horas: number;
  total_dias: number;
  dias: {
    dia: number;
    horas: number;
    es_especial: boolean;
  }[];
  valor_total: number;
  total_hed: number;
  total_hen: number;
  total_horas_trabajadas: number;
  total_dias_laborados: number;
  total_hefd: number;
  total_hefn: number;
  total_rn: number;
  total_rd: number;
  dias_laborales: DiaLaboralPlanilla[];
  estado: "activo" | "inactivo" | "pendiente" | "aprobado" | "rechazado";
}

interface CanvasData {
  mes: number;
  año: number;
  total_recargos: number;
  recargos: CanvasRecargo[];
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errores?: ValidationError[];
}

// Tipo específico para la respuesta de tipos de recargo
export interface TiposRecargoApiResponse extends ApiResponse<TipoRecargo[]> {
  data: TipoRecargo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata?: {
    filtros_aplicados: Record<string, any>;
    ordenamiento: {
      campo: string;
      direccion: string;
    };
  };
}

interface Festivos {
  dia: number;
  mes: number;
  año: number;
  nombre: string;
  tipo: string;
  fechaCompleta: string;
}

// ✅ INTERFAZ DEL CONTEXTO MEJORADA CON NUEVAS FUNCIONALIDADES
interface RecargoContextType {
  // Estado de festivos
  diasFestivos: Festivos[];
  // Estados de datos existentes
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  empresas: Empresa[];

  // ✅ NUEVOS ESTADOS PARA TIPOS DE RECARGO Y CONFIGURACIÓN
  tiposRecargo: TipoRecargo[];
  configuracionesSalario: ConfiguracionSalario[];
  configuracionSalarioVigente: ConfiguracionSalario | null;

  // Estados de UI
  loading: boolean;
  error: string | null;
  validationErrors: ValidationError[] | null;

  // ✅ NUEVOS ESTADOS DE LOADING ESPECÍFICOS
  loadingTiposRecargo: boolean;
  loadingConfigSalario: boolean;

  // Estados de cache
  lastFetch: {
    conductores?: number;
    vehiculos?: number;
    empresas?: number;
    recargos?: number;
    tiposRecargo?: number;
    configuracionesSalario?: number;
  };

  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;

  // Funciones principales existentes
  clearError: () => void;
  registrarRecargo: (
    recargoData: any,
  ) => Promise<{ success: boolean; data?: any }>;
  actualizarRecargo: (
    id: string,
    recargoData: any,
  ) => Promise<{ success: boolean; data?: any }>;

  // Funciones optimizadas para obtener recargos
  obtenerRecargosParaCanvas: (
    mes: number,
    año: number,
    empresa_id?: string,
  ) => Promise<CanvasData>;
  obtenerRecargoPorId: (id: string) => Promise<RecargoResponse | null>;

  // ✅ NUEVAS FUNCIONES PARA TIPOS DE RECARGO
  obtenerTiposRecargo: (
    filtros?: FiltrosTipoRecargo,
  ) => Promise<TiposRecargoData>;
  obtenerTiposRecargoPorCategoria: (
    categoria: string,
  ) => Promise<TipoRecargo[]>;
  obtenerCategoriasTiposRecargo: () => Promise<
    { codigo: string; nombre: string }[]
  >;
  crearTipoRecargo: (
    tipoData: Partial<TipoRecargo>,
  ) => Promise<{ success: boolean; data?: TipoRecargo }>;
  actualizarTipoRecargo: (
    id: string,
    tipoData: Partial<TipoRecargo>,
  ) => Promise<{ success: boolean; data?: TipoRecargo }>;
  eliminarTipoRecargo: (id: string) => Promise<{ success: boolean }>;
  activarTipoRecargo: (
    id: string,
  ) => Promise<{ success: boolean; data?: TipoRecargo }>;
  calcularValorRecargo: (
    codigoTipo: string,
    horas: number,
    valorHoraBase: number,
  ) => Promise<{ success: boolean; data?: any }>;

  // ✅ NUEVAS FUNCIONES PARA CONFIGURACIÓN DE SALARIOS
  obtenerConfiguracionesSalario: (
    filtros?: FiltrosConfigSalario,
  ) => Promise<ConfiguracionesSalarioData>;
  obtenerConfiguracionSalarioVigente: (
    empresaId?: string,
  ) => Promise<ConfiguracionSalario | null>;
  crearConfiguracionSalario: (
    configData: Partial<ConfiguracionSalario>,
  ) => Promise<{ success: boolean; data?: ConfiguracionSalario }>;
  actualizarConfiguracionSalario: (
    id: string,
    configData: Partial<ConfiguracionSalario>,
  ) => Promise<{ success: boolean; data?: ConfiguracionSalario }>;
  eliminarConfiguracionSalario: (id: string) => Promise<{ success: boolean }>;
  calcularValorHora: (
    salarioBasico: number,
    horasMensuales?: number,
  ) => Promise<{ success: boolean; data?: any }>;

  // Funciones para refresh de datos básicos
  refrescarConductores: () => Promise<void>;
  refrescarVehiculos: () => Promise<void>;
  refrescarEmpresas: () => Promise<void>;
  refrescarTiposRecargo: () => Promise<void>;
  refrescarConfiguracionesSalario: () => Promise<void>;
}

// ✅ CONTEXTO CREADO
const RecargoContext = createContext<RecargoContextType | undefined>(undefined);

// ✅ PROVEEDOR DEL CONTEXTO OPTIMIZADO CON NUEVAS FUNCIONALIDADES
export const RecargoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estados principales existentes
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null);

  // Estados de datos existentes
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  // ===== ESTADO PARA DÍAS FESTIVOS =====
  // Estados principales
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // getMonth() devuelve 0-11
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [diasFestivos, setDiasFestivos] = useState<Festivos[]>([]);

  // ✅ NUEVOS ESTADOS PARA TIPOS DE RECARGO Y CONFIGURACIÓN
  const [tiposRecargo, setTiposRecargo] = useState<TipoRecargo[]>([]);
  const [configuracionesSalario, setConfiguracionesSalario] = useState<
    ConfiguracionSalario[]
  >([]);
  const [configuracionSalarioVigente, setConfiguracionSalarioVigente] =
    useState<ConfiguracionSalario | null>(null);

  // ✅ NUEVOS ESTADOS DE LOADING ESPECÍFICOS
  const [loadingTiposRecargo, setLoadingTiposRecargo] =
    useState<boolean>(false);
  const [loadingConfigSalario, setLoadingConfigSalario] =
    useState<boolean>(false);

  // Estado de cache para evitar llamadas innecesarias (actualizado)
  const [lastFetch, setLastFetch] = useState<{
    conductores?: number;
    vehiculos?: number;
    empresas?: number;
    recargos?: number;
    tiposRecargo?: number;
    configuracionesSalario?: number;
  }>({});

  // ✅ FUNCIÓN MEJORADA PARA MANEJAR ERRORES (sin cambios)
  const handleApiError = useCallback(
    (err: unknown, defaultMessage: string): string => {
      if (isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiResponse<any>>;

        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const errorMessage = axiosError.response.data?.message;
          const validationErrors = axiosError.response.data?.errores;

          if (validationErrors) {
            setValidationErrors(validationErrors);
          }

          switch (statusCode) {
            case 401:
              return "Sesión expirada o usuario no autenticado";
            case 403:
              return "No tienes permisos para realizar esta acción";
            case 404:
              return "Recurso no encontrado";
            case 422:
              return errorMessage || "Datos de entrada inválidos";
            case 500:
              return "Error interno del servidor";
            default:
              return errorMessage || `Error en la petición (${statusCode})`;
          }
        } else if (axiosError.request) {
          return "No se pudo conectar con el servidor. Verifica tu conexión a internet";
        } else {
          return `Error al configurar la petición: ${axiosError.message}`;
        }
      } else {
        return `${defaultMessage}: ${(err as Error).message}`;
      }
    },
    [],
  );

  // ✅ FUNCIÓN PARA LIMPIAR ERRORES (sin cambios)
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors(null);
  }, []);

  // ✅ CACHE TTL (Time To Live) - 5 minutos (sin cambios)
  const CACHE_TTL = 5 * 60 * 1000;

  const isCacheValid = useCallback((lastFetchTime?: number): boolean => {
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime < CACHE_TTL;
  }, []);

  // OBTENER CONDUCTORES CON CACHE (sin cambios)
  const obtenerConductores = useCallback(
    async (force = false): Promise<void> => {
      if (
        !force &&
        isCacheValid(lastFetch.conductores) &&
        conductores.length > 0
      ) {
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<Conductor[]>>(
          "/api/conductores/basicos",
        );

        if (response.data.success) {
          setConductores(response.data.data);
          setLastFetch((prev) => ({ ...prev, conductores: Date.now() }));
        } else {
          throw new Error(
            response.data.message || "Error al obtener conductores",
          );
        }
      } catch (err: any) {
        const errorMessage = handleApiError(
          err,
          "Error al obtener conductores",
        );
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [conductores.length, lastFetch.conductores, isCacheValid, handleApiError],
  );

  // OBTENER VEHÍCULOS CON CACHE (sin cambios)
  const obtenerVehiculos = useCallback(
    async (force = false): Promise<void> => {
      if (!force && isCacheValid(lastFetch.vehiculos) && vehiculos.length > 0) {
        return;
      }

      try {
        setLoading(true);
        const response =
          await apiClient.get<ApiResponse<Vehiculo[]>>("/api/flota/basicos");

        if (response.data.success) {
          setVehiculos(response.data.data);
          setLastFetch((prev) => ({ ...prev, vehiculos: Date.now() }));
        } else {
          throw new Error(
            response.data.message || "Error al obtener vehículos",
          );
        }
      } catch (err: any) {
        const errorMessage = handleApiError(err, "Error al obtener vehículos");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [vehiculos.length, lastFetch.vehiculos, isCacheValid, handleApiError],
  );

  // OBTENER EMPRESAS CON CACHE (sin cambios)
  const obtenerEmpresas = useCallback(
    async (force = false): Promise<void> => {
      if (!force && isCacheValid(lastFetch.empresas) && empresas.length > 0) {
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<Empresa[]>>(
          "/api/empresas/basicos",
        );

        if (response.data.success) {
          setEmpresas(response.data.data);
          setLastFetch((prev) => ({ ...prev, empresas: Date.now() }));
        } else {
          throw new Error(response.data.message || "Error al obtener empresas");
        }
      } catch (err: any) {
        const errorMessage = handleApiError(err, "Error al obtener empresas");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [empresas.length, lastFetch.empresas, isCacheValid, handleApiError],
  );

  // OBTENER CONFIGURACIONES DE SALARIO CON CACHE
  const obtenerConfiguracionesSalario = useCallback(
    async (filtros: FiltrosConfigSalario = {}): Promise<any> => {
      const isSimpleRequest = !filtros.empresa_id && !filtros.page;

      if (
        isSimpleRequest &&
        isCacheValid(lastFetch.configuracionesSalario) &&
        configuracionesSalario.length > 0
      ) {
        return {
          data: configuracionesSalario,
          pagination: {
            total: configuracionesSalario.length,
            page: 1,
            limit: configuracionesSalario.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      try {
        setLoadingConfigSalario(true);
        const params = new URLSearchParams();

        // Construir parámetros
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<
          ApiResponse<ConfiguracionSalario[]>
        >(`/api/configuraciones-salario?${params.toString()}`);

        if (response.data.success) {
          // ✅ CORRECCIÓN: Extraer solo el array de datos para el estado
          if (isSimpleRequest) {
            // Destructuring para mayor claridad

            setConfiguracionesSalario(response.data.data); // ← Cambio aquí: solo el array
            setLastFetch((prev) => ({
              ...prev,
              configuracionesSalario: Date.now(),
            }));
          }

          return response.data.data;
        } else {
          throw new Error(
            response.data.message ||
              "Error al obtener configuraciones de salario",
          );
        }
      } catch (err) {
        console.error("❌ Error obteniendo configuraciones de salario:", err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener configuraciones de salario",
        );
        setError(errorMessage);

        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [
      configuracionesSalario,
      lastFetch.configuracionesSalario,
      isCacheValid,
      handleApiError,
    ],
  );

  // OBTENER CONFIGURACIÓN DE SALARIO VIGENTE
  const obtenerConfiguracionSalarioVigente = useCallback(
    async (empresaId?: string): Promise<ConfiguracionSalario | null> => {
      try {
        setLoadingConfigSalario(true);
        const params = new URLSearchParams();

        if (empresaId) {
          params.append("empresa_id", empresaId);
        }

        const response = await apiClient.get<ApiResponse<ConfiguracionSalario>>(
          `/api/configuraciones-salario/vigente?${params.toString()}`,
        );

        if (response.data.success) {
          const config = response.data.data;
          setConfiguracionSalarioVigente(config);
          return config;
        } else {
          throw new Error(
            response.data.message || "No se encontró configuración vigente",
          );
        }
      } catch (err) {
        console.error("❌ Error obteniendo configuración vigente:", err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener configuración vigente",
        );
        setError(errorMessage);
        return null;
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [handleApiError],
  );

  // CREAR CONFIGURACIÓN DE SALARIO
  const crearConfiguracionSalario = useCallback(
    async (
      configData: Partial<ConfiguracionSalario>,
    ): Promise<{ success: boolean; data?: ConfiguracionSalario }> => {
      try {
        setLoadingConfigSalario(true);
        clearError();

        const response = await apiClient.post<
          ApiResponse<ConfiguracionSalario>
        >("/api/configuraciones-salario", configData);

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({
            ...prev,
            configuracionesSalario: undefined,
          }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(
            response.data.message || "Error al crear configuración de salario",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error creando configuración de salario:", err);
        const errorMessage = handleApiError(
          err,
          "Error al crear configuración de salario",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [clearError, handleApiError],
  );

  // ACTUALIZAR CONFIGURACIÓN DE SALARIO
  const actualizarConfiguracionSalario = useCallback(
    async (
      id: string,
      configData: Partial<ConfiguracionSalario>,
    ): Promise<{ success: boolean; data?: ConfiguracionSalario }> => {
      try {
        setLoadingConfigSalario(true);
        clearError();

        const response = await apiClient.put<ApiResponse<ConfiguracionSalario>>(
          `/api/configuraciones-salario/${id}`,
          configData,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({
            ...prev,
            configuracionesSalario: undefined,
          }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(
            response.data.message ||
              "Error al actualizar configuración de salario",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error actualizando configuración de salario:", err);
        const errorMessage = handleApiError(
          err,
          "Error al actualizar configuración de salario",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [clearError, handleApiError],
  );

  // ELIMINAR CONFIGURACIÓN DE SALARIO
  const eliminarConfiguracionSalario = useCallback(
    async (id: string): Promise<{ success: boolean }> => {
      try {
        setLoadingConfigSalario(true);
        clearError();

        const response = await apiClient.delete<ApiResponse<any>>(
          `/api/configuraciones-salario/${id}`,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({
            ...prev,
            configuracionesSalario: undefined,
          }));

          return { success: true };
        } else {
          setError(
            response.data.message ||
              "Error al eliminar configuración de salario",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error eliminando configuración de salario:", err);
        const errorMessage = handleApiError(
          err,
          "Error al eliminar configuración de salario",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [clearError, handleApiError],
  );

  // CALCULAR VALOR HORA
  const calcularValorHora = useCallback(
    async (
      salarioBasico: number,
      horasMensuales: number = 240,
    ): Promise<{ success: boolean; data?: any }> => {
      try {
        setLoadingConfigSalario(true);
        clearError();

        const response = await apiClient.post<ApiResponse<any>>(
          "/api/configuraciones-salario/calcular-valor-hora",
          {
            salario_basico: salarioBasico,
            horas_mensuales: horasMensuales,
          },
        );

        if (response.data.success) {
          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(response.data.message || "Error al calcular valor hora");
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error calculando valor hora:", err);
        const errorMessage = handleApiError(
          err,
          "Error al calcular valor hora",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingConfigSalario(false);
      }
    },
    [clearError, handleApiError],
  );

  // REGISTRAR RECARGO MEJORADO (sin cambios)
  const registrarRecargo = useCallback(
    async (recargoData: any): Promise<{ success: boolean; data?: any }> => {
      setLoading(true);
      clearError();

      try {
        let response;

        if (recargoData instanceof FormData) {
          response = await apiClient.post<ApiResponse<any>>(
            "/api/recargos",
            recargoData,
          );
        } else {
          response = await apiClient.post<ApiResponse<any>>(
            "/api/recargos",
            recargoData,
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (response.data.success) {
          // ✅ Invalidar cache de recargos para que se recarguen
          setLastFetch((prev) => ({ ...prev, recargos: undefined }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(response.data.message || "Error al registrar el recargo");
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error al registrar recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al registrar el recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleApiError],
  );

  // OBTENER RECARGOS PARA CANVAS (sin cambios)
  const obtenerRecargosParaCanvas = useCallback(
    async (
      mes: number,
      año: number,
      empresa_id?: string,
    ): Promise<CanvasData> => {
      setLoading(true);
      clearError();

      try {
        const params = new URLSearchParams({
          mes: mes.toString(),
          año: año.toString(),
        });

        if (empresa_id) params.append("empresa_id", empresa_id);

        const response = await apiClient.get<ApiResponse<CanvasData>>(
          `/api/recargos?${params.toString()}`,
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Error al obtener datos para canvas",
          );
        }
      } catch (err) {
        console.error("❌ Error obteniendo datos para canvas:", err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener datos para canvas",
        );
        setError(errorMessage);

        return {
          mes,
          año,
          total_recargos: 0,
          recargos: [],
        };
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleApiError],
  );

  // OBTENER RECARGO POR ID (sin cambios)
  const obtenerRecargoPorId = useCallback(
    async (id: string): Promise<RecargoResponse | null> => {
      setLoading(true);
      clearError();

      try {
        const response = await apiClient.get<RecargoResponse>(
          `/api/recargos/${id}`,
        );

        if (response.data.success) {
          return response.data;
        } else {
          throw new Error(response.data.message || "Error al obtener recargo");
        }
      } catch (err) {
        console.error("❌ Error obteniendo recargo por ID:", err);
        const errorMessage = handleApiError(err, "Error al obtener recargo");
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleApiError],
  );

  const actualizarRecargo = useCallback(
    async (
      id: string,
      recargoData: any,
    ): Promise<{ success: boolean; data?: any }> => {
      setLoading(true);
      clearError();

      try {
        let response;

        // ✅ Validar que el ID sea válido
        if (!id || typeof id !== "string") {
          throw new Error("ID del recargo es requerido");
        }

        if (recargoData instanceof FormData) {
          // ✅ Si es FormData (con archivos)
          response = await apiClient.put<ApiResponse<any>>(
            `/api/recargos/${id}`,
            recargoData,
          );
        } else {
          // ✅ Si es JSON
          response = await apiClient.put<ApiResponse<any>>(
            `/api/recargos/${id}`,
            recargoData,
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (response.data.success) {
          // ✅ Invalidar cache de recargos para que se recarguen
          setLastFetch((prev) => ({ ...prev, recargos: undefined }));

          // ✅ También invalidar el cache del recargo individual si existe
          setLastFetch((prev) => ({
            ...prev,
            [`recargo_${id}`]: undefined,
          }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(response.data.message || "Error al actualizar el recargo");
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error al actualizar recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al actualizar el recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleApiError, setLastFetch],
  );

  // OBTENER TIPOS DE RECARGO CON CACHE
  const obtenerTiposRecargo = useCallback(
    async (filtros: FiltrosTipoRecargo = {}): Promise<TiposRecargoData> => {
      const isSimpleRequest = !filtros.categoria && !filtros.page;

      if (
        isSimpleRequest &&
        isCacheValid(lastFetch.tiposRecargo) &&
        tiposRecargo.length > 0
      ) {
        return {
          data: tiposRecargo,
          pagination: {
            total: tiposRecargo.length,
            page: 1,
            limit: tiposRecargo.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      try {
        setLoadingTiposRecargo(true);
        const params = new URLSearchParams();

        // Construir parámetros
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<TiposRecargoApiResponse>(
          `/api/tipos-recargo?${params.toString()}`,
        );

        if (response.data.success) {
          if (isSimpleRequest) {
            // ✅ Ahora TypeScript entiende que es TipoRecargo[]
            setTiposRecargo(response.data.data);
            setLastFetch((prev) => ({ ...prev, tiposRecargo: Date.now() }));
          }

          // ✅ Retorna la estructura completa
          // ✅ Retorna la estructura completa TiposRecargoData
          return {
            data: response.data.data,
            pagination: response.data.pagination,
            metadata: response.data.metadata,
          };
        } else {
          // ✅ AGREGADO: Manejar caso cuando success es false
          throw new Error(
            response.data.message || "Error al obtener tipos de recargo",
          );
        }
      } catch (err) {
        console.error("❌ Error obteniendo tipos de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener tipos de recargo",
        );
        setError(errorMessage);

        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [tiposRecargo, lastFetch.tiposRecargo, isCacheValid, handleApiError],
  );

  // OBTENER TIPOS DE RECARGO POR CATEGORÍA
  const obtenerTiposRecargoPorCategoria = useCallback(
    async (categoria: string): Promise<TipoRecargo[]> => {
      try {
        setLoadingTiposRecargo(true);
        const response = await apiClient.get<ApiResponse<TipoRecargo[]>>(
          `/api/tipos-recargo/por-categoria/${categoria}`,
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Error al obtener tipos por categoría",
          );
        }
      } catch (err) {
        console.error("❌ Error obteniendo tipos por categoría:", err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener tipos por categoría",
        );
        setError(errorMessage);
        return [];
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [handleApiError],
  );

  // OBTENER CATEGORÍAS DE TIPOS DE RECARGO
  const obtenerCategoriasTiposRecargo = useCallback(async (): Promise<
    { codigo: string; nombre: string }[]
  > => {
    try {
      setLoadingTiposRecargo(true);
      const response = await apiClient.get<
        ApiResponse<{ codigo: string; nombre: string }[]>
      >("/api/tipos-recargo/categorias");

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Error al obtener categorías");
      }
    } catch (err) {
      console.error("❌ Error obteniendo categorías:", err);
      const errorMessage = handleApiError(err, "Error al obtener categorías");
      setError(errorMessage);
      return [];
    } finally {
      setLoadingTiposRecargo(false);
    }
  }, [handleApiError]);

  // CREAR TIPO DE RECARGO
  const crearTipoRecargo = useCallback(
    async (
      tipoData: Partial<TipoRecargo>,
    ): Promise<{ success: boolean; data?: TipoRecargo }> => {
      try {
        setLoadingTiposRecargo(true);
        clearError();

        const response = await apiClient.post<ApiResponse<TipoRecargo>>(
          "/api/tipos-recargo",
          tipoData,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({ ...prev, tiposRecargo: undefined }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(response.data.message || "Error al crear tipo de recargo");
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error creando tipo de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al crear tipo de recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [clearError, handleApiError],
  );

  // ACTUALIZAR TIPO DE RECARGO
  const actualizarTipoRecargo = useCallback(
    async (
      id: string,
      tipoData: Partial<TipoRecargo>,
    ): Promise<{ success: boolean; data?: TipoRecargo }> => {
      try {
        setLoadingTiposRecargo(true);
        clearError();

        const response = await apiClient.put<ApiResponse<TipoRecargo>>(
          `/api/tipos-recargo/${id}`,
          tipoData,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({ ...prev, tiposRecargo: undefined }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(
            response.data.message || "Error al actualizar tipo de recargo",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error actualizando tipo de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al actualizar tipo de recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [clearError, handleApiError],
  );

  // ELIMINAR TIPO DE RECARGO
  const eliminarTipoRecargo = useCallback(
    async (id: string): Promise<{ success: boolean }> => {
      try {
        setLoadingTiposRecargo(true);
        clearError();

        const response = await apiClient.delete<ApiResponse<any>>(
          `/api/tipos-recargo/${id}`,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({ ...prev, tiposRecargo: undefined }));

          return { success: true };
        } else {
          setError(
            response.data.message || "Error al eliminar tipo de recargo",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error eliminando tipo de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al eliminar tipo de recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [clearError, handleApiError],
  );

  // ACTIVAR TIPO DE RECARGO
  const activarTipoRecargo = useCallback(
    async (id: string): Promise<{ success: boolean; data?: TipoRecargo }> => {
      try {
        setLoadingTiposRecargo(true);
        clearError();

        const response = await apiClient.put<ApiResponse<TipoRecargo>>(
          `/api/tipos-recargo/${id}/activar`,
        );

        if (response.data.success) {
          // Invalidar cache
          setLastFetch((prev) => ({ ...prev, tiposRecargo: undefined }));

          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(response.data.message || "Error al activar tipo de recargo");
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error activando tipo de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al activar tipo de recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [clearError, handleApiError],
  );

  // CALCULAR VALOR DE RECARGO
  const calcularValorRecargo = useCallback(
    async (
      codigoTipo: string,
      horas: number,
      valorHoraBase: number,
    ): Promise<{ success: boolean; data?: any }> => {
      try {
        setLoadingTiposRecargo(true);
        clearError();

        const response = await apiClient.post<ApiResponse<any>>(
          "/api/tipos-recargo/calcular-valor",
          {
            codigo_tipo: codigoTipo,
            horas: horas,
            valor_hora_base: valorHoraBase,
          },
        );

        if (response.data.success) {
          return {
            success: true,
            data: response.data.data,
          };
        } else {
          setError(
            response.data.message || "Error al calcular valor de recargo",
          );
          return { success: false };
        }
      } catch (err) {
        console.error("❌ Error calculando valor de recargo:", err);
        const errorMessage = handleApiError(
          err,
          "Error al calcular valor de recargo",
        );
        setError(errorMessage);
        return { success: false };
      } finally {
        setLoadingTiposRecargo(false);
      }
    },
    [clearError, handleApiError],
  );

  const refrescarConductores = useCallback(
    () => obtenerConductores(true),
    [obtenerConductores],
  );

  const refrescarVehiculos = useCallback(
    () => obtenerVehiculos(true),
    [obtenerVehiculos],
  );

  const refrescarEmpresas = useCallback(
    () => obtenerEmpresas(true),
    [obtenerEmpresas],
  );

  // ✅ NUEVAS FUNCIONES DE REFRESH
  const refrescarTiposRecargo = useCallback(async () => {
    setLastFetch((prev) => ({ ...prev, tiposRecargo: undefined }));
    await obtenerTiposRecargo();
  }, [obtenerTiposRecargo]);

  const refrescarConfiguracionesSalario = useCallback(async () => {
    setLastFetch((prev) => ({ ...prev, configuracionesSalario: undefined }));
    await obtenerConfiguracionesSalario();
  }, [obtenerConfiguracionesSalario]);

  useEffect(() => {
    const inicializar = async () => {
      try {
        // Cargar datos básicos en paralelo
        await Promise.all([
          obtenerConductores(),
          obtenerVehiculos(),
          obtenerEmpresas(),
          obtenerTiposRecargo(),
          obtenerConfiguracionesSalario(),
        ]);

        // Obtener configuración vigente por separado
        await obtenerConfiguracionSalarioVigente();

        // Cargar festivos para el año actual
        const festivos = obtenerFestivosCompletos(selectedYear);

        setDiasFestivos(festivos);
      } catch (error) {
        console.error("❌ Error en inicialización:", error);
      }
    };

    inicializar();
  }, []); // Solo ejecutar una vez

  const recargoContext: RecargoContextType = {
    // Dias festivos
    diasFestivos,

    // Estados de datos existentes
    conductores,
    vehiculos,
    empresas,

    // ✅ NUEVOS ESTADOS
    tiposRecargo,
    configuracionesSalario,
    configuracionSalarioVigente,

    // Estados de UI existentes
    loading,
    error,
    validationErrors,
    lastFetch,

    // ✅ NUEVOS ESTADOS DE LOADING
    loadingTiposRecargo,
    loadingConfigSalario,

    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,

    // Funciones existentes
    clearError,
    registrarRecargo,
    obtenerRecargosParaCanvas,
    obtenerRecargoPorId,
    actualizarRecargo,

    // ✅ NUEVAS FUNCIONES PARA TIPOS DE RECARGO
    obtenerTiposRecargo,
    obtenerTiposRecargoPorCategoria,
    obtenerCategoriasTiposRecargo,
    crearTipoRecargo,
    actualizarTipoRecargo,
    eliminarTipoRecargo,
    activarTipoRecargo,
    calcularValorRecargo,

    // ✅ NUEVAS FUNCIONES PARA CONFIGURACIÓN DE SALARIOS
    obtenerConfiguracionesSalario,
    obtenerConfiguracionSalarioVigente,
    crearConfiguracionSalario,
    actualizarConfiguracionSalario,
    eliminarConfiguracionSalario,
    calcularValorHora,

    // Funciones de refresh (actualizadas)
    refrescarConductores,
    refrescarVehiculos,
    refrescarEmpresas,
    refrescarTiposRecargo,
    refrescarConfiguracionesSalario,
  };

  return (
    <RecargoContext.Provider value={recargoContext}>
      {children}
    </RecargoContext.Provider>
  );
};

// ===============================================
// ✅ HOOK PERSONALIZADO OPTIMIZADO (sin cambios)
// ===============================================

export const useRecargo = (): RecargoContextType => {
  const context = useContext(RecargoContext);

  if (!context) {
    throw new Error("useRecargo debe ser usado dentro de un RecargoProvider");
  }

  return context;
};

// ===============================================
// ✅ HOOKS ESPECIALIZADOS (actualizados y nuevos)
// ===============================================

// Hook existente para canvas (sin cambios)
export const useRecargosCanvas = (
  mes: number,
  año: number,
  empresa_id?: string,
) => {
  const { obtenerRecargosParaCanvas, loading, error } = useRecargo();
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);

  const cargarDatos = useCallback(async () => {
    const datos = await obtenerRecargosParaCanvas(mes, año, empresa_id);
    setCanvasData(datos);
  }, [mes, año, empresa_id, obtenerRecargosParaCanvas]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    canvasData,
    loading,
    error,
    refrescar: cargarDatos,
  };
};

// ✅ NUEVO HOOK PARA TIPOS DE RECARGO
export const useTiposRecargo = (categoria?: string) => {
  const {
    tiposRecargo,
    obtenerTiposRecargo,
    obtenerTiposRecargoPorCategoria,
    loadingTiposRecargo,
    error,
  } = useRecargo();

  const [tiposFiltrados, setTiposFiltrados] = useState<TipoRecargo[]>([]);

  const cargarTipos = useCallback(async () => {
    if (categoria) {
      const tipos = await obtenerTiposRecargoPorCategoria(categoria);
      setTiposFiltrados(tipos);
    } else {
      await obtenerTiposRecargo();
      setTiposFiltrados(tiposRecargo);
    }
  }, [
    categoria,
    obtenerTiposRecargo,
    obtenerTiposRecargoPorCategoria,
    tiposRecargo,
  ]);

  useEffect(() => {
    cargarTipos();
  }, [cargarTipos]);

  return {
    tipos: categoria ? tiposFiltrados : tiposRecargo,
    loading: loadingTiposRecargo,
    error,
    refrescar: cargarTipos,
  };
};

// ✅ NUEVO HOOK PARA CONFIGURACIÓN DE SALARIOS
export const useConfiguracionSalario = (empresaId?: string) => {
  const {
    configuracionSalarioVigente,
    obtenerConfiguracionSalarioVigente,
    loadingConfigSalario,
    error,
  } = useRecargo();

  const cargarConfiguracion = useCallback(async () => {
    await obtenerConfiguracionSalarioVigente(empresaId);
  }, [empresaId, obtenerConfiguracionSalarioVigente]);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  return {
    configuracion: configuracionSalarioVigente,
    loading: loadingConfigSalario,
    error,
    refrescar: cargarConfiguracion,
  };
};

export default RecargoProvider;
