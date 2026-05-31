import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, spacing } from '@/lib/theme/tokens';

type StackHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
};

export function StackHeader({ title, subtitle, onBack, rightAction }: StackHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
      </Pressable>
      <View style={styles.titles}>
        <AppText variant="titleLarge" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} style={styles.rightAction} hitSlop={8}>
          <AppText variant="label" color={colors.accent.primary}>
            {rightAction.label}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  rightAction: {
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
});
