import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  card: string;
  cardSecondary: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  headerBg: string;
  headerText: string;
  navBg: string;
  navBorder: string;
  primary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  divider: string;
}

export const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  headerBg: '#0C447C',
  headerText: '#FFFFFF',
  navBg: '#FFFFFF',
  navBorder: '#E2E8F0',
  primary: '#0C447C',
  accent: '#185FA5',
  badgeBg: '#E6F1FB',
  badgeText: '#0C447C',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputText: '#0F172A',
  divider: '#E2E8F0',
};

export const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0B132B',
  card: '#1C2541',
  cardSecondary: '#243054',
  cardBorder: '#3A4A74',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  headerBg: '#0B132B',
  headerText: '#F8FAFC',
  navBg: '#1C2541',
  navBorder: '#3A4A74',
  primary: '#38BDF8',
  accent: '#60A5FA',
  badgeBg: '#243054',
  badgeText: '#38BDF8',
  inputBg: '#243054',
  inputBorder: '#3A4A74',
  inputText: '#F8FAFC',
  divider: '#3A4A74',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
