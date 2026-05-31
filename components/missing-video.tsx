import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';

type MissingVideoProps = {
  onRelink?: () => void;
  onRemove?: () => void;
};

export function MissingVideo({ onRelink, onRemove }: MissingVideoProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.accent.danger}>
        Video unavailable
      </AppText>
      <AppText variant="body" muted>
        This video may have been deleted from your photo library or your media permissions may have
        changed.
      </AppText>
      <View style={styles.actions}>
        <ActionChip label="Relink video" onPress={onRelink} primary />
        <ActionChip label="Remove reference" onPress={onRemove} />
      </View>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress?: () => void;
  primary?: boolean;
}) {
  return (
    <AppText
      variant="label"
      color={primary ? colors.accent.primary : colors.text.secondary}
      onPress={onPress}
      style={[styles.chip, primary && styles.chipPrimary]}>
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
  },
  chipPrimary: {
    textDecorationLine: 'underline',
  },
});
