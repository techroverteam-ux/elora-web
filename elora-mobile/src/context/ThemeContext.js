import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const theme = {
    colors: {
      primary: darkMode ? '#FCD34D' : '#F59E0B',
      background: darkMode ? '#000000' : '#FFFFFF',
      surface: darkMode ? '#1F2937' : '#F9FAFB',
      text: darkMode ? '#FFFFFF' : '#111827',
      textSecondary: darkMode ? '#9CA3AF' : '#6B7280',
      border: darkMode ? '#374151' : '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleTheme,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};