import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius } from '@/lib/theme/tokens';
import type { VideoAvailabilityStatus } from '@/types/domain';

type VideoPlaceholderProps = {
  status: VideoAvailabilityStatus | 'none';
  onPress?: () => void;
  aspectRatio?: number;
};

export function VideoPlaceholder({ status, onPress, aspectRatio = 16 / 9 }: VideoPlaceholderProps) {
  const isMissing = status === 'missing' || status === 'permissionDenied';

  const content = (
    <View style={[styles.box, { aspectRatio }, isMissing && styles.missing]}>
      <Ionicons
        name={isMissing ? 'videocam-off' : status === 'available' ? 'play-circle' : 'videocam-outline'}
        size={40}
        color={isMissing ? colors.accent.danger : colors.text.muted}
      />
      {isMissing ? (
        <AppText variant="caption" color={colors.accent.danger}>
          Unavailable
        </AppText>
      ) : status === 'available' ? (
        <AppText variant="caption" muted>
          Tap to play
        </AppText>
      ) : (
        <AppText variant="caption" muted>
          No video
        </AppText>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9 }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  missing: {
    borderColor: 'rgba(229, 72, 77, 0.4)',
  },
});
