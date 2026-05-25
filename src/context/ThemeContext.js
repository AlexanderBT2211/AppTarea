import React, { createContext, useState, useContext, useMemo } from 'react';

export const themes = {
  light: {
    name: 'light',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF0E0',
    primary: '#FF7A00',
    primaryDark: '#E06800',
    text: '#2D1A00',
    textSecondary: '#7A5C3A',
    border: '#FFD199',
    error: '#FF4D6A',
    success: '#06C48C',
    inputBg: '#FFFFFF',
    switchTrackFalse: '#FFD199',
    switchTrackTrue: '#FF7A00',
    switchThumb: '#FFFFFF',
    placeholder: '#C49A6C',
    tagBg: '#FFF0D0',
    tagText: '#E06800',
    btnEliminarBg: '#FFE0E6',
    accent: '#00CFCF',
    accentBg: '#E0FAFA',
    yellow: '#FFD000',
    yellowBg: '#FFFBE0',
  },
  dark: {
    name: 'dark',
    background: '#000000',
    surface: '#111111',
    surfaceAlt: '#1A1A1A',
    primary: '#FF9A30',
    primaryDark: '#FF7A00',
    text: '#FFFFFF',
    textSecondary: '#888888',
    border: '#2A2A2A',
    error: '#FF6B85',
    success: '#34D399',
    inputBg: '#1A1A1A',
    switchTrackFalse: '#333333',
    switchTrackTrue: '#FF7A00',
    switchThumb: '#FFFFFF',
    placeholder: '#555555',
    tagBg: '#1A1A1A',
    tagText: '#FF9A30',
    btnEliminarBg: '#2A1010',
    accent: '#00CFCF',
    accentBg: '#001A1A',
    yellow: '#FFD000',
    yellowBg: '#1A1500',
  },
};

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(prev => !prev);
  const theme = isDark ? themes.dark : themes.light;
  const value = useMemo(() => ({ theme, isDark, toggleTheme }), [isDark]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === null) throw new Error('useTheme() debe usarse dentro de <ThemeProvider>');
  return context;
};
