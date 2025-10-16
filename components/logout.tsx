"use client";

import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/config/apiClient";

export const useLogout = () => {
  const { refreshProfile } = useAuth();

  const logout = async () => {
    try {
      // 1. Llamar al endpoint de logout en el backend (si existe)
      await apiClient.post("/api/usuarios/logout");
    } catch (error) {
      // Continuar con el logout local incluso si falla el servidor
    } finally {
      // 2. Limpiar cookies y storage
      clearAuthData();

      // 3. Actualizar el estado de autenticación
      await refreshProfile();

      // 4. Redirigir al sistema de autenticación
      redirectToAuthSystem();
    }
  };

  const clearAuthData = () => {
    // Limpiar cookies de autenticación
    const cookiesToClear = ["token", "userInfo"];

    cookiesToClear.forEach((cookieName) => {
      // Eliminar en path raíz
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

      // Eliminar en dominio raíz si es un subdominio
      const domainParts = window.location.hostname.split(".");
      if (domainParts.length > 1) {
        const rootDomain = domainParts.slice(-2).join(".");
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain}`;
      }
    });

    // Limpiar localStorage y sessionStorage
    const storageKeys = [
      "userSession",
      "authToken",
      "userInfo",
      "userPreferences",
      "appState",
    ];

    storageKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Limpiar todo el localStorage y sessionStorage por seguridad
    localStorage.clear();
    sessionStorage.clear();
  };

  const redirectToAuthSystem = () => {
    const authSystem =
      process.env.NEXT_PUBLIC_AUTH_SYSTEM || "http://auth.midominio.local:3001";
    window.location.href = authSystem;
  };

  return {
    logout,
    clearAuthData,
    redirectToAuthSystem,
  };
};

export default useLogout;
