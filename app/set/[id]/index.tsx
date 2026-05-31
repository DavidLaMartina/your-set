import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MissingVideo } from '@/components/missing-video';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetTypeBadge } from '@/components/set-type-badge';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel } from '@/features/mock-data';
import { loadSetWithContext } from '@/features/history/services/variant-history-service';
import { setCompareHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import type { HistorySetRow } from '@/types/domain';
import { SET_TYPE_LABELS } from '@/types/domain';

export default function SetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [set, setSet] = useState<HistorySetRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setSet(await loadSetWithContext(id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!set) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>
          Set not found in the database. Workout-tab sets now use saved IDs — reload the app if you
          still see this after opening a set from the current workout.
        </AppText>
      </Screen>
    );
  }

  const videoStatus = set.video?.availabilityStatus ?? 'none';
  const isMissing = videoStatus === 'missing' || videoStatus === 'permissionDenied';

  return (
    <Screen>
      <StackHeader title="Set detail" />
      <View style={styles.stats}>
        <AppText variant="titleLarge">{formatSetLabel(set.weight, set.reps)}</AppText>
        {set.setType !== 'straight' ? <SetTypeBadge setType={set.setType} /> : null}
      </View>

      <Metadata label="Performed" value={formatPerformedAt(set.performedAt)} />
      <Metadata
        label="Session"
        value={
          set.workoutId
            ? set.workoutName ?? 'In session'
            : 'None (set-only log)'
        }
      />
      <Metadata label="Set type" value={SET_TYPE_LABELS[set.setType]} />
      {set.rir != null ? <Metadata label="RIR" value={String(set.rir)} /> : null}
      {set.isFailure ? <Metadata label="Failure" value="Yes" /> : null}
      {set.notes ? <Metadata label="Notes" value={set.notes} /> : null}

      <AppText variant="titleMedium">Video</AppText>
      {isMissing ? (
        <MissingVideo onRelink={() => {}} onRemove={() => {}} />
      ) : (
        <VideoPlaceholder
          status={videoStatus === 'none' ? 'unknown' : videoStatus}
          onPress={() => {}}
        />
      )}

      <PrimaryButton
        label="Compare with prior set"
        onPress={() => router.push(setCompareHref(set.id))}
      />

      {!isMissing && videoStatus !== 'none' ? (
        <PrimaryButton label="Remove video reference" variant="danger" onPress={() => {}} />
      ) : null}
    </Screen>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaRow: {
    gap: 2,
  },
});
