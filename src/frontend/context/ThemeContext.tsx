// src/context/ThemeContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  lightBrightness: number;
  setLightBrightness: (value: number) => void;
  lightSoftness: number;
  setLightSoftness: (value: number) => void;
  resetLightThemeTuning: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const getInitialTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      
      return false; // Sistem tercihine bakmayı bıraktık, varsayılan 'light'

    } catch (e) {
      return false;
    }
  }
  return false;
};

const getInitialNumber = (key: string, fallback: number, min: number, max: number): number => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  } catch {
    return fallback;
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [lightBrightness, setLightBrightness] = useState<number>(() =>
    getInitialNumber('lightThemeBrightness', 96, 82, 105)
  );
  const [lightSoftness, setLightSoftness] = useState<number>(() =>
    getInitialNumber('lightThemeSoftness', 12, 0, 35)
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('lightThemeBrightness', String(lightBrightness));
    document.documentElement.style.setProperty('--ui-light-brightness', (lightBrightness / 100).toFixed(2));
  }, [lightBrightness]);

  useEffect(() => {
    localStorage.setItem('lightThemeSoftness', String(lightSoftness));
    document.documentElement.style.setProperty('--ui-light-softness', (lightSoftness / 100 * 0.18).toFixed(3));
  }, [lightSoftness]);

  const toggleTheme = () => {
    setIsDark(prevIsDark => !prevIsDark);
  };

  const resetLightThemeTuning = () => {
    setLightBrightness(96);
    setLightSoftness(12);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        lightBrightness,
        setLightBrightness,
        lightSoftness,
        setLightSoftness,
        resetLightThemeTuning
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};