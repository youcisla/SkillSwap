import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

// Enhanced theme configurations
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ea',
    primaryContainer: '#bb86fc',
    secondary: '#03dac6',
    secondaryContainer: '#4dd0e1',
    tertiary: '#ff6b6b',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
    error: '#cf6679',
    warning: '#ff9800',
    success: '#4caf50',
    info: '#2196f3',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onSurface: '#1c1b1f',
    onBackground: '#1c1b1f',
    outline: '#79747e',
    shadow: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#f4eff4',
    inversePrimary: '#d0bcff',
    surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
    onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
    backdrop: 'rgba(50, 47, 53, 0.4)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  },
  animation: {
    scale: 1.02,
    duration: {
      short: 150,
      medium: 300,
      long: 500,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    primaryContainer: '#6200ea',
    secondary: '#03dac6',
    secondaryContainer: '#005457',
    tertiary: '#ff8a80',
    surface: '#121212',
    surfaceVariant: '#1e1e1e',
    background: '#000000',
    error: '#cf6679',
    warning: '#ffb74d',
    success: '#81c784',
    info: '#64b5f6',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#e1e2e1',
    onBackground: '#e1e2e1',
    outline: '#938f99',
    shadow: '#000000',
    inverseSurface: '#e6e1e5',
    inverseOnSurface: '#313033',
    inversePrimary: '#6750a4',
    surfaceDisabled: 'rgba(227, 226, 230, 0.12)',
    onSurfaceDisabled: 'rgba(227, 226, 230, 0.38)',
    backdrop: 'rgba(50, 47, 53, 0.4)',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: lightTheme.shadows,
  animation: lightTheme.animation,
};

export type AppTheme = typeof lightTheme;

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = React.useState(systemColorScheme === 'dark');

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeMode(savedTheme as 'light' | 'dark' | 'system');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  // Update theme based on mode and system preference
  useEffect(() => {
    const updateTheme = () => {
      switch (themeMode) {
        case 'light':
          setIsDark(false);
          break;
        case 'dark':
          setIsDark(true);
          break;
        case 'system':
          setIsDark(systemColorScheme === 'dark');
          break;
      }
    };
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.surface} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};
