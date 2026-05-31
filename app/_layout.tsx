import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppThemeProvider } from '@/lib/theme/app-theme-provider';
import { colors } from '@/lib/theme/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
        }}
      />
      <StatusBar style="light" />
    </AppThemeProvider>
  );
}
