import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themeTokens, type ThemeMode, type ThemeTokens } from '../theme/tokens';

interface ThemeContextValue {
  theme: ThemeMode;
  tokens: ThemeTokens;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'light' ? 'light' : 'dark';
  const tokens = themeTokens[theme];

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      tokens,
      isDark: theme === 'dark',
    }),
    [theme, tokens]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
