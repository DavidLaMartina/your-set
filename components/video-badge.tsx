import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import type { VideoAvailabilityStatus } from '@/types/domain';

type VideoBadgeProps = {
  status: VideoAvailabilityStatus | 'none';
  onPress?: () => void;
  compact?: boolean;
};

export function VideoBadge({ status, onPress, compact }: VideoBadgeProps) {
  const config = getConfig(status);

  const inner = (
    <View
      style={[
        styles.badge,
        compact && styles.compact,
        { backgroundColor: config.backgroundColor, borderColor: config.borderColor },
      ]}>
      <Ionicons name={config.icon} size={compact ? 16 : 18} color={config.color} />
      {!compact && config.label ? (
        <AppText variant="caption" color={config.color}>
          {config.label}
        </AppText>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={config.a11y}>
        {inner}
      </Pressable>
    );
  }

  return inner;
}

function getConfig(status: VideoBadgeProps['status']) {
  switch (status) {
    case 'available':
      return {
        icon: 'videocam' as const,
        color: colors.accent.primary,
        backgroundColor: 'rgba(201, 162, 39, 0.12)',
        borderColor: 'rgba(201, 162, 39, 0.35)',
        label: 'Video',
        a11y: 'Set has video',
      };
    case 'missing':
    case 'permissionDenied':
      return {
        icon: 'videocam-off' as const,
        color: colors.accent.danger,
        backgroundColor: 'rgba(229, 72, 77, 0.1)',
        borderColor: 'rgba(229, 72, 77, 0.3)',
        label: 'Missing',
        a11y: 'Video unavailable',
      };
    case 'unknown':
      return {
        icon: 'videocam-outline' as const,
        color: colors.text.muted,
        backgroundColor: colors.bg.subtle,
        borderColor: colors.border.default,
        label: 'Attach',
        a11y: 'Attach video',
      };
    default:
      return {
        icon: 'add-circle-outline' as const,
        color: colors.text.secondary,
        backgroundColor: colors.bg.subtle,
        borderColor: colors.border.default,
        label: 'Attach',
        a11y: 'Attach video to set',
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 36,
    justifyContent: 'center',
  },
  compact: {
    paddingHorizontal: 6,
    minWidth: 32,
    minHeight: 32,
  },
});
