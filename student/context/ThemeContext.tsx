import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: {
    bg: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    subText: '#6B7280',
    border: '#E5E7EB',
    outline: '#9CA3AF',
    headerBg: '#FFFFFF',
    headerBorder: '#F3F4F6'
  }
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem('@settings_dark_mode');
      if (stored !== null) {
        setIsDark(stored === 'true');
      }
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('@settings_dark_mode', newVal.toString());
  };

  const theme = isDark ? {
    bg: '#111827', // Dark blue-gray
    card: '#1F2937', 
    text: '#F9FAFB',
    subText: '#9CA3AF',
    border: '#374151',
    outline: '#6B7280',
    headerBg: '#111827',
    headerBorder: '#1F2937'
  } : {
    bg: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    subText: '#6B7280',
    border: '#E5E7EB',
    outline: '#9CA3AF',
    headerBg: '#F9FAFB',
    headerBorder: '#F3F4F6'
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
