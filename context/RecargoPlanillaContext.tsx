"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { AxiosError, isAxiosError } from "axios";
import LoadingPage from "@/components/ui/loadingPage";
import { Conductor, Empresa, Vehiculo } from "@/types";
import { apiClientMain } from "@/api/main";

// Interfaz para los filtros
interface FiltrosRecargo {
  mes?: number;
  año?: number;
  page?: number;
  limit?: number;
}

// Interfaz para la respuesta de recargos
interface RecargoResponse {
  id: string;
  conductor_id: string;
  vehiculo_id: string;
  empresa_id: string;
  numero_planilla: string;
  mes: number;
  año: number;
  total_horas_trabajadas: number;
  total_hed: number;
  total_hen: number;
  total_hefd: number;
  total_hefn: number;
  total_rn: number;
  total_rd: number;
  archivo_planilla_url?: string;
  archivo_planilla_nombre?: string;
  archivo_planilla_tipo?: string;
  archivo_planilla_tamaño?: number;
  estado: string;
  observaciones?: string;
  version: number;
  creado_por_id: string;
  actualizado_por_id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  dias_laborales: DiaLaboral[];
  conductor: {
    id: string;
    nombre: string;
    apellido: string;
    numero_identificacion: string;
  };
  vehiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
  };
  empresa: {
    id: string;
    nombre: string;
    nit: string;
  };
}

interface DiaLaboral {
  id: string;
  recargo_planilla_id: string;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  total_horas: number;
  hed: number;
  hen: number;
  hefd: number;
  hefn: number;
  rn: number;
  rd: number;
  es_festivo: boolean;
  es_domingo: boolean;
  observaciones?: string;
  creado_por_id: string;
  actualizado_por_id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface RecargosData {
  recargos: RecargoResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Actualizar la interfaz del contexto
interface RecargoContextType {
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  empresas: Empresa[];
  recargos: RecargoResponse[]; // Agregar esta línea
  loading: boolean;
  error: string | null;
  validationErrors: ValidationError[] | null;
  clearError: () => void;
  registrarRecargo: (recargoData: any) => Promise<void>;
  obtenerRecargos: (filtros?: FiltrosRecargo) => Promise<RecargosData>; // Agregar esta línea
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
  errores?: ValidationError[];
}

// Crear el contexto
const RecargoContext = createContext<RecargoContextType | undefined>(undefined);

// Proveedor del contexto
export const RecargoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initializing, setInitializing] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null);

  const [conductores, setConductores] = useState<Conductor[] | []>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[] | []>([]);
  const [empresas, setEmpresas] = useState<Empresa[] | []>([]);
  const [recargos, setRecargos] = useState<RecargoResponse[]>([]);

  // Función para manejar errores de Axios
  const handleApiError = (err: unknown, defaultMessage: string): string => {
    if (isAxiosError(err)) {
      const axiosError = err as AxiosError<ApiResponse<any>>;

      if (axiosError.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        const statusCode = axiosError.response.status;
        const errorMessage = axiosError.response.data?.message;
        const validationErrors = axiosError.response.data?.errores;

        if (validationErrors) {
          setValidationErrors(validationErrors);
        }

        if (statusCode === 401) {
          return "Sesión expirada o usuario no autenticado";
        } else if (statusCode === 403) {
          return "No tienes permisos para realizar esta acción";
        } else if (statusCode === 404) {
          return "Conductor no encontrado";
        } else {
          return errorMessage || `Error en la petición (${statusCode})`;
        }
      } else if (axiosError.request) {
        // La petición fue hecha pero no se recibió respuesta
        return "No se pudo conectar con el servidor. Verifica tu conexión a internet";
      } else {
        // Error al configurar la petición
        return `Error al configurar la petición: ${axiosError.message}`;
      }
    } else {
      // Error que no es de Axios
      return `${defaultMessage}: ${(err as Error).message}`;
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    setError(null);
    setValidationErrors(null);
  };

  const obtenerDatos = async () => {
    try {
      // Realizar todas las consultas en paralelo
      const [conductoresResponse, empresasResponse, flotaResponse] =
        await Promise.all([
          apiClientMain("/conductores/basicos"),
          apiClientMain("/empresas/basicos"),
          apiClientMain("/flota/basicos"),
        ]);

      // Actualizar todos los estados con los datos obtenidos
      setConductores(conductoresResponse.data.data || []);
      setEmpresas(empresasResponse.data.data || []);
      setVehiculos(flotaResponse.data.data || []); // Asumiendo que flota son los vehículos
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      // Establecer arrays vacíos en caso de error
      setConductores([]);
      setEmpresas([]);
      setVehiculos([]);
    }
  };

  // Función para registrar un recargo
  const registrarRecargo = useCallback(
    async (recargoData: any): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        let response;

        // Verificar si es FormData (con archivo adjunto)
        if (recargoData instanceof FormData) {
          console.log('=== Enviando FormData (multipart) ===');

          // Debug FormData
          for (let [key, value] of recargoData.entries()) {
            if (value instanceof File) {
              console.log(`${key}:`, {
                name: value.name,
                size: value.size,
                type: value.type
              });
            } else {
              console.log(`${key}:`, value);
            }
          }

          // Envío multipart - sin especificar Content-Type (el navegador lo hace automáticamente)
          response = await apiClientMain.post<ApiResponse<any>>(
            "/recargos",
            recargoData,
            {
              headers: {
                // NO agregar 'Content-Type': 'multipart/form-data'
                // El navegador lo hace automáticamente con el boundary correcto
              }
            }
          );

        } else {
          console.log('=== Enviando JSON normal ===');
          console.log(recargoData);

          // Envío JSON normal
          response = await apiClientMain.post<ApiResponse<any>>(
            "/recargos",
            recargoData,
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
        }

        if (response.data.success) {
          console.log("Recargo registrado exitosamente");
          // Aquí podrías actualizar el estado si es necesario
          // await fetchRecargos(); // Por ejemplo, recargar la lista
        } else {
          setError(response.data.message || "Error al registrar el recargo");
        }

      } catch (err) {
        console.error('Error al registrar recargo:', err);
        const errorMessage = handleApiError(
          err,
          "Error al registrar el recargo",
        );
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Función para obtener recargos
  const obtenerRecargos = useCallback(
    async (filtros: FiltrosRecargo = {}): Promise<RecargosData> => {
      setLoading(true);
      clearError();

      try {
        // Construir parámetros de consulta
        const params = new URLSearchParams();

        if (filtros.mes !== undefined) {
          params.append('mes', filtros.mes.toString());
        }

        if (filtros.año !== undefined) {
          params.append('año', filtros.año.toString());
        }

        if (filtros.page !== undefined) {
          params.append('page', filtros.page.toString());
        }

        if (filtros.limit !== undefined) {
          params.append('limit', filtros.limit.toString());
        }

        // Construir URL con parámetros
        const url = params.toString() ? `/recargos?${params.toString()}` : '/recargos';

        console.log('🔍 Obteniendo recargos con filtros:', filtros);
        console.log('📡 URL de consulta:', url);

        const response = await apiClientMain.get<ApiResponse<RecargosData>>(url);

        if (response.data.success) {
          const recargosData = response.data.data;

          // Actualizar estado con los recargos obtenidos
          setRecargos(recargosData.recargos);

          console.log(recargosData);

          return recargosData;
        } else {
          throw new Error(response.data.message || "Error al obtener recargos");
        }
      } catch (err) {
        console.error('❌ Error obteniendo recargos:', err);
        const errorMessage = handleApiError(
          err,
          "Error al obtener los recargos",
        );
        setError(errorMessage);

        // Retornar estructura vacía en caso de error
        return {
          recargos: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Efecto de inicialización
  useEffect(() => {
    obtenerDatos();
    obtenerRecargos();

    // Establecer un tiempo máximo para la inicialización
    const timeoutId = setTimeout(() => {
      if (initializing) {
        setInitializing(false);
      }
    }, 5000); // 5 segundos máximo de espera

    return () => clearTimeout(timeoutId);
  }, []);

  // Contexto que será proporcionado
  const recargoContext: RecargoContextType = {
    recargos,
    obtenerRecargos,
    conductores,
    vehiculos,
    empresas,
    loading,
    error,
    validationErrors,
    clearError,
    registrarRecargo,
  };

  // Mostrar pantalla de carga durante la inicialización
  if (initializing) {
    return <LoadingPage>Cargando Conductores</LoadingPage>;
  }

  return (
    <RecargoContext.Provider value={recargoContext}>
      {children}
    </RecargoContext.Provider>
  );
};

// Hook para usar el contexto
export const useRecargo = (): RecargoContextType => {
  const context = useContext(RecargoContext);

  if (!context) {
    throw new Error("useRecargo debe ser usado dentro de un RecargoPlanilla");
  }

  return context;
};

export default RecargoProvider;
