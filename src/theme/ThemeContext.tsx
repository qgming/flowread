import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { getTheme, Theme } from './theme';
import { loadSettings, ThemeMode, updateSetting } from '../utils/settingsStorage';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean; // 计算出的实际主题
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(getTheme(false));

  // 根据主题模式和系统主题计算实际主题
  const calculateTheme = (mode: ThemeMode, systemColorScheme: string | null | undefined): boolean => {
    switch (mode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'system':
      default:
        return systemColorScheme === 'dark';
    }
  };

  // 更新主题
  const updateTheme = (mode: ThemeMode, systemColorScheme: string | null | undefined) => {
    const darkMode = calculateTheme(mode, systemColorScheme);
    setIsDarkMode(darkMode);
    setTheme(getTheme(darkMode));
  };

  useEffect(() => {
    loadSettings().then(settings => {
      const mode = settings.themeMode;
      setThemeMode(mode);
      const systemColorScheme = Appearance.getColorScheme();
      updateTheme(mode, systemColorScheme);
    });

    // 监听系统主题变化
    const subscription = Appearance.addChangeListener((preferences) => {
      updateTheme(themeMode, preferences.colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // 当themeMode变化时更新主题
  useEffect(() => {
    const systemColorScheme = Appearance.getColorScheme();
    updateTheme(themeMode, systemColorScheme);
  }, [themeMode]);

  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await updateSetting('themeMode', mode);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      setThemeMode: handleSetThemeMode,
      isDarkMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
