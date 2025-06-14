import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Enhanced color palette with improved accessibility
export const colors = {
  primary: {
    main: '#6366f1', // More modern, accessible purple
    light: '#818cf8',
    dark: '#4338ca',
    surface: '#f1f5f9',
    contrast: '#ffffff',
  },
  secondary: {
    main: '#06b6d4', // Improved cyan for better contrast
    light: '#22d3ee',
    dark: '#0891b2',
    surface: '#ecfeff',
    contrast: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    surface: '#e8f5e8',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    surface: '#fff3e0',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    surface: '#ffebee',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  gradient: {
    primary: ['#6200ea', '#9c4dff'] as const,
    secondary: ['#03dac6', '#66fff0'] as const,
    sunset: ['#ff6b6b', '#ffa726'] as const,
    ocean: ['#2196f3', '#00bcd4'] as const,
  },
};

// Typography scale
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0.25,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  h6: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

// Enhanced spacing system (4px base grid)
export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 1000,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Animation configurations
export const animations = {
  timing: {
    fast: 200,
    medium: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    spring: {
      damping: 15,
      stiffness: 150,
    },
  },
  scale: {
    press: 0.96,
    hover: 1.02,
  },
  opacity: {
    hidden: 0,
    visible: 1,
    disabled: 0.6,
  },
};

// Micro-interactions
export const microInteractions = {
  buttonPress: {
    scale: 0.98,
    duration: 150,
  },
  cardPress: {
    scale: 0.99,
    duration: 100,
  },
  listItemPress: {
    scale: 0.995,
    duration: 80,
  },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary.main,
    primaryContainer: colors.primary.surface,
    secondary: colors.secondary.main,
    secondaryContainer: colors.secondary.surface,
    surface: '#ffffff',
    surfaceVariant: colors.neutral[100],
    background: colors.neutral[50],
    onBackground: colors.neutral[900],
    onSurface: colors.neutral[800],
    onSurfaceVariant: colors.neutral[600],
    success: colors.success.main,
    warning: colors.warning.main,
    error: colors.error.main,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary.light,
    primaryContainer: '#4a0e4e',
    secondary: colors.secondary.main,
    secondaryContainer: '#004d40',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    background: '#121212',
    onBackground: colors.neutral[100],
    onSurface: colors.neutral[200],
    onSurfaceVariant: colors.neutral[400],
    success: colors.success.light,
    warning: colors.warning.light,
    error: colors.error.light,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

export type Theme = typeof lightTheme;
