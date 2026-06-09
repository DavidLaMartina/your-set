import { router } from 'expo-router';

import { setDetailHref } from '@/lib/navigation';
import { Pressable, StyleSheet, View } from 'react-native';

import { DenseInput } from '@/components/dense-input';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import { colors, spacing } from '@/lib/theme/tokens';
import type { SetWithVideo } from '@/types/domain';

type SetRowProps = {
  set: SetWithVideo;
  index: number;
  onPress?: () => void;
};

export function SetRow({ set, index, onPress }: SetRowProps) {
  const videoStatus = set.video?.availabilityStatus ?? 'none';

  const openSetDetail = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(setDetailHref(set.id));
  };

  return (
    <Pressable
      onPress={openSetDetail}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Set ${index}, ${set.weight ?? '—'} by ${set.reps ?? '—'} reps`}>
      <AppText variant="caption" muted style={styles.index}>
        {index}
      </AppText>
      <View style={styles.inputs}>
        <DenseInput
          value={set.weight != null ? String(set.weight) : ''}
          placeholder="lb"
          editable={false}
        />
        <AppText variant="dataLarge" muted style={styles.times}>
          ×
        </AppText>
        <DenseInput
          value={set.reps != null ? String(set.reps) : ''}
          placeholder="reps"
          editable={false}
        />
      </View>
      <VideoBadge status={videoStatus} compact />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.subtle,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.9,
  },
  index: {
    width: 18,
    textAlign: 'center',
  },
  inputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  times: {
    marginTop: 2,
  },
});
