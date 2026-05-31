import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button">
      <AppText
        variant="label"
        color={
          variant === 'primary' ? colors.text.inverse : variant === 'danger' ? colors.accent.danger : colors.text.primary
        }>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent.primary,
  },
  ghost: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.danger,
  },
  pressed: {
    opacity: 0.88,
  },
});
