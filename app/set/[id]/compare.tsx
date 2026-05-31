import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import {
  formatPerformedAt,
  formatSetLabel,
  getMockSetById,
  mockPriorCompareSet,
} from '@/features/mock-data';
import { MOCK_IDS } from '@/features/mock-data/ids';
import { colors, spacing } from '@/lib/theme/tokens';
import { SET_TYPE_LABELS, type SetWithVideo } from '@/types/domain';

export default function VideoCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentSet =
    id === MOCK_IDS.setTodayTop || id === MOCK_IDS.setPriorCompare
      ? getMockSetById(id) ?? getMockSetById(MOCK_IDS.setTodayTop)
      : getMockSetById(id ?? MOCK_IDS.setTodayTop);

  const priorSet = mockPriorCompareSet;

  if (!currentSet) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Compare" />
        <AppText muted>Set not found.</AppText>
      </Screen>
    );
  }

  const left = currentSet.id === priorSet.id ? getMockSetById(MOCK_IDS.setTodayTop)! : currentSet;
  const right = priorSet;

  return (
    <Screen>
      <StackHeader title="Compare" subtitle="Side-by-side — playback in Phase 4" />
      <View style={styles.panes}>
        <ComparePane label="Current" set={left} />
        <ComparePane label="Prior" set={right} />
      </View>
      <AppText variant="caption" muted style={styles.note}>
        Phase 1 uses placeholders. Real video playback arrives in Phase 4.
      </AppText>
      <PrimaryButton label="Change comparison target" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function ComparePane({ label, set }: { label: string; set: SetWithVideo }) {
  const videoStatus = set.video?.availabilityStatus ?? 'none';

  return (
    <View style={styles.pane}>
      <AppText variant="label" color={colors.accent.primary}>
        {label}
      </AppText>
      <AppText variant="caption" muted>
        {formatPerformedAt(set.performedAt)}
      </AppText>
      <VideoPlaceholder status={videoStatus === 'none' ? 'unknown' : videoStatus} />
      <AppText variant="dataLarge">{formatSetLabel(set.weight, set.reps)}</AppText>
      <AppText variant="caption" muted>
        {SET_TYPE_LABELS[set.setType]}
        {set.rir != null ? ` · RIR ${set.rir}` : ''}
      </AppText>
      {set.notes ? (
        <AppText variant="caption" muted numberOfLines={3}>
          {set.notes}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pane: {
    flex: 1,
    gap: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
});
