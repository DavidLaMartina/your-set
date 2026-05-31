import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/lib/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
}: ScreenProps) {
  const paddingStyle = padded ? { paddingHorizontal: spacing.lg } : undefined;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <View style={[styles.fill, paddingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
});
