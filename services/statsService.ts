"use client";

import createApiClient from "@/config/apiClient";

export interface DashboardStats {
  vehiculos: number;
  conductores: number;
  empresas: number;
  recargos: number;
  usuarios: number;
}

export interface VehiculoStats {
  total: number;
  activos: number;
  inactivos: number;
  enMantenimiento: number;
  porTipo: Array<{
    tipo: string;
    cantidad: number;
  }>;
}

export interface ConductorStats {
  total: number;
  conVehiculo: number;
  sinVehiculo: number;
}

export interface RecargoStats {
  total: number;
  pendientes: number;
  completados: number;
  totalMesActual: number;
}

/**
 * Obtiene las estadísticas generales del dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get("/api/stats/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de vehículos
 */
export const getVehiculoStats = async (): Promise<VehiculoStats> => {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get("/api/stats/vehiculos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de vehículos:", error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de conductores
 */
export const getConductorStats = async (): Promise<ConductorStats> => {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get("/api/stats/conductores");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de conductores:", error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de recargos
 */
export const getRecargoStats = async (): Promise<RecargoStats> => {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get("/api/stats/recargos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de recargos:", error);
    throw error;
  }
};
