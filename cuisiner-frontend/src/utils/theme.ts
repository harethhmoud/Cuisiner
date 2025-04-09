import { DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal' as const,
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300' as const,
  },
  thin: {
    fontFamily: 'System',
    fontWeight: '100' as const,
  },
};

// Color palette inspired by cooking and food
export const theme = {
  ...DefaultTheme,
  dark: false,
  roundness: 8,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    primary: '#E53935', // A vibrant red, good for main actions
    primaryLight: '#FFCDD2', // Light red for backgrounds
    primaryDark: '#B71C1C', // Dark red for emphasis
    accent: '#4CAF50', // Green for secondary actions
    accentLight: '#C8E6C9', // Light green for success indicators
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textLight: '#757575',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#E53935',
    error: '#D32F2F',
    warning: '#FFA000',
    success: '#388E3C',
    info: '#1976D2',
  },
};

export type AppTheme = typeof theme; 