"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";

import RecargoProvider from "@/context/RecargoPlanillaContext";
import AuthProvider from "@/context/AuthContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider locale="es-ES" navigate={router.push}>
      <ToastProvider maxVisibleToasts={2} placement="bottom-center" />
      <AuthProvider>
        <RecargoProvider>
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        </RecargoProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
