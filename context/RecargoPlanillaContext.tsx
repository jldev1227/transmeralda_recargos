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

// Definición del contexto
interface RecargoContextType {
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  empresas: Empresa[];
  loading: boolean;
  error: string | null;
  validationErrors: ValidationError[] | null;
  clearError: () => void;
  registrarRecargo: (recargoData: any) => Promise<void>;
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

      console.log(recargoData);

      try {
        const response = await apiClientMain.post<ApiResponse<any>>(
          "/recargos",
          recargoData,
        );

        if (response.data.success) {
          // Aquí podrías actualizar el estado de conductores, vehículos o empresas si es necesario
          console.log("Recargo registrado exitosamente");
        } else {
          setError(response.data.message || "Error al registrar el recargo");
        }
      } catch (err) {
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

  // Efecto de inicialización
  useEffect(() => {
    obtenerDatos();

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
