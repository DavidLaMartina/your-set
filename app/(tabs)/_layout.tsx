import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, spacing } from '@/lib/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="workout"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.elevated,
          borderTopColor: colors.border.default,
          height: 56,
          paddingBottom: spacing.xs,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
