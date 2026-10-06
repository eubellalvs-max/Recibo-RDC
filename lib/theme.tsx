'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light';

interface ThemeContextType {
  theme: 'light';
  isDark: false;
  toggleTheme: () => void;
  setTheme: (theme: 'light') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      try {
        localStorage.removeItem('recibo_rdc_theme');
      } catch {
        // ignore
      }
    }
  }, []);

  const value = React.useMemo<ThemeContextType>(
    () => ({
      theme: 'light',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Retorna null pois o modo escuro foi completamente excluído do sistema
export function ThemeToggle(_props: {
  className?: string;
  variant?: 'icon' | 'badge' | 'button' | 'segmented';
  showLabel?: boolean;
}) {
  return null;
}
