// src/context/ThemeContext.js
// Contexto global para manejar el tema dark/light de la aplicación.
//
// Patrón utilizado: Context API + custom hook (useTheme)
// Esto evita prop drilling y centraliza toda la lógica de temas.

import React, { createContext, useState, useContext, useMemo } from 'react';

// ─── Paleta de colores ────────────────────────────────────────────────────────
// Definida FUERA del componente para que sea una referencia estable
// (no se recrea en cada render).
export const themes = {
  light: {
    name: 'light',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F5',
    primary: '#4F6CF7',
    primaryDark: '#3A56D4',
    text: '#1A1D2E',
    textSecondary: '#6B7280',
    border: '#E2E5EF',
    error: '#EF4444',
    success: '#10B981',
    inputBg: '#FFFFFF',
    cardShadow: '#00000014',   // rgba sin template string (compatible con StyleSheet)
    switchTrackFalse: '#D1D5DB',
    switchTrackTrue: '#4F6CF7',
    switchThumb: '#FFFFFF',
    placeholder: '#9CA3AF',
    tagBg: '#EEF2FF',
    tagText: '#4F6CF7',
    btnEliminarBg: '#FECACA', // color sólido en lugar de hex+opacidad dinámica
  },
  dark: {
    name: 'dark',
    background: '#0D0F1A',
    surface: '#161927',
    surfaceAlt: '#1E2130',
    primary: '#6C8EFF',
    primaryDark: '#4F6CF7',
    text: '#F0F2FF',
    textSecondary: '#8892B0',
    border: '#252840',
    error: '#FF6B6B',
    success: '#34D399',
    inputBg: '#1E2130',
    cardShadow: '#00000066',
    switchTrackFalse: '#374151',
    switchTrackTrue: '#4F6CF7',
    switchThumb: '#FFFFFF',
    placeholder: '#4B5563',
    tagBg: '#1E2545',
    tagText: '#6C8EFF',
    btnEliminarBg: '#3B1212',
  },
};

// ─── Contexto ─────────────────────────────────────────────────────────────────
// Se exporta por si algún componente necesita consumirlo directamente,
// aunque lo recomendado es usar el hook useTheme().
export const ThemeContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // useCallback no aplica aquí (es una función sin dependencias),
  // pero useMemo en el value evita re-renders innecesarios en consumidores
  // cuando el componente padre re-renderiza por razones ajenas al tema.
  const toggleTheme = () => setIsDark(prev => !prev);

  const theme = isDark ? themes.dark : themes.light;

  // useMemo: el objeto value solo cambia cuando isDark o theme cambia,
  // evitando que todos los consumidores re-rendericen sin necesidad.
  const value = useMemo(
    () => ({ theme, isDark, toggleTheme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook personalizado ───────────────────────────────────────────────────────
// Siempre usar este hook en lugar de useContext(ThemeContext) directamente.
// Lanza un error descriptivo si se usa fuera del Provider.
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error(
      'useTheme() debe usarse dentro de <ThemeProvider>. ' +
      'Asegúrate de que App esté envuelto en ThemeProvider.'
    );
  }
  return context;
};
