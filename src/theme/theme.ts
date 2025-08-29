export interface ThemeColors {
  // 背景色
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // 文字色
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // 边框和分割线
  border: string;
  divider: string;
  
  // 强调色
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  
  // 状态色
  success: string;
  warning: string;
  error: string;
  
  // 交互状态
  hover: string;
  pressed: string;
  
  // 遮罩
  overlay: string;
  modalBackground: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F2F2F7',
    
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#3C3C4399',
    
    border: '#C6C6C8',
    divider: '#C6C6C8',
    
    primary: '#007AFF',
    primaryContainer: '#007AFF1A',
    onPrimary: '#FFFFFF',
    
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    
    hover: '#0000000A',
    pressed: '#00000014',
    
    overlay: '#00000033',
    modalBackground: '#FFFFFF',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#EBEBF599',
    
    border: '#38383A',
    divider: '#38383A',
    
    primary: '#0A84FF',
    primaryContainer: '#0A84FF1A',
    onPrimary: '#FFFFFF',
    
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    
    hover: '#FFFFFF0A',
    pressed: '#FFFFFF14',
    
    overlay: '#00000080',
    modalBackground: '#1C1C1E',
  },
};

export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};
