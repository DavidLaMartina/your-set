import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/lib/db/database-provider';
import { AppThemeProvider } from '@/lib/theme/app-theme-provider';
import { colors } from '@/lib/theme/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <DatabaseProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.base },
            }}
          />
          <StatusBar style="light" />
        </DatabaseProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
