import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetVideoPlayer } from '@/components/set-video-player';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { loadSetWithContext } from '@/features/history/services/exercise-history-service';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import { colors, spacing } from '@/lib/theme/tokens';
import { SET_TYPE_LABELS, type HistorySetRow } from '@/types/domain';

export default function VideoCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [left, setLeft] = useState<HistorySetRow | null>(null);
  const [right, setRight] = useState<HistorySetRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const current = await loadSetWithContext(id);
      setLeft(current);

      if (current) {
        const peers = await SetRepo.listSetsByExercise(current.exerciseId);
        const prior = peers.find(
          (s) => s.id !== current.id && s.setType === 'top_set',
        );
        if (prior) {
          setRight(await loadSetWithContext(prior.id));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Compare" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!left) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Compare" />
        <AppText muted>Set not found.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title="Compare" subtitle="Side-by-side" />
      <View style={styles.panes}>
        <ComparePane label="Selected" set={left} />
        {right ? (
          <ComparePane label="Prior top" set={right} />
        ) : (
          <View style={styles.pane}>
            <AppText variant="caption" muted>
              No prior top set to compare
            </AppText>
          </View>
        )}
      </View>
      <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function ComparePane({ label, set }: { label: string; set: HistorySetRow }) {
  const videoStatus = set.video?.availabilityStatus ?? 'none';
  const canPlay = videoStatus === 'available' && !!set.video?.uri;

  return (
    <View style={styles.pane}>
      <AppText variant="label" color={colors.accent.primary}>
        {label}
      </AppText>
      <AppText variant="caption" muted>
        {formatPerformedAt(set.performedAt)}
      </AppText>
      {canPlay ? (
        <SetVideoPlayer uri={set.video!.uri!} aspectRatio={9 / 16} />
      ) : (
        <VideoPlaceholder status={videoStatus === 'none' ? 'unknown' : videoStatus} />
      )}
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
