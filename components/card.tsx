import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';

type CardProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Navigates from title/chevron only — set rows and actions stay independent. */
  onHeaderPress?: () => void;
  /** Press anywhere on the card (avoid on workout blocks with set rows). */
  onPress?: () => void;
  style?: ViewStyle;
  headerRight?: ReactNode;
};

export function Card({
  children,
  title,
  subtitle,
  onHeaderPress,
  onPress,
  style,
  headerRight,
}: CardProps) {
  const header = (title || subtitle || headerRight) && (
    <View style={styles.header}>
      {onHeaderPress ? (
        <Pressable
          onPress={onHeaderPress}
          style={({ pressed }) => [styles.headerPressable, pressed && styles.pressed]}
          accessibilityRole="button">
          <View style={styles.headerText}>
            {title ? (
              <AppText variant="titleMedium" numberOfLines={2}>
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText variant="caption" muted numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {headerRight}
        </Pressable>
      ) : (
        <>
          <View style={styles.headerText}>
            {title ? (
              <AppText variant="titleMedium" numberOfLines={2}>
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText variant="caption" muted numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {headerRight}
        </>
      )}
    </View>
  );

  const content = (
    <>
      {header}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
});
