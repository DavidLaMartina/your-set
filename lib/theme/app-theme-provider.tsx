import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { createContext, useContext, type ReactNode } from 'react';

import { colors, navigationTheme } from '@/lib/theme/tokens';

const yourSetNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    ...navigationTheme.colors,
  },
};

type AppThemeContextValue = {
  colors: typeof colors;
};

const AppThemeContext = createContext<AppThemeContextValue>({ colors });

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <AppThemeContext.Provider value={{ colors }}>
      <NavigationThemeProvider value={yourSetNavigationTheme}>{children}</NavigationThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
