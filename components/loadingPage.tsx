"use client";

import React, { ReactNode } from "react";

const LoadingPage = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="flex flex-col items-center">
        {/* Círculo animado con pulso */}
        <div className="relative mb-8 opacity-0 animate-bounceIn">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border border-emerald-400 animate-pulseRing" />
        </div>

        {/* Texto animado con fade-in */}
        <div className="text-center opacity-0 animate-fadeInUp animation-delay-300">
          <p className="text-emerald-600 text-lg font-medium mb-4">
            {children}
          </p>
          <div className="flex justify-center space-x-1">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce animation-delay-100" />
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce animation-delay-200" />
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce animation-delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
