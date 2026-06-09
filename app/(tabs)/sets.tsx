import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import { listRecentSets, type RecentSetRow } from '@/features/sets/services/recent-sets-service';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { setDetailHref, exercisePickerForLogSetHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';

export default function SetsScreen() {
  const [rows, setRows] = useState<RecentSetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listRecentSets());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Sets</AppText>
        <AppText variant="caption" muted>
          Recent logs — newest first. Log a set anytime without a workout.
        </AppText>
      </View>

      <PrimaryButton
        label="+ Log set"
        onPress={() => router.push(exercisePickerForLogSetHref())}
      />

      {loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          No sets logged yet. Tap + Log set to record one.
        </AppText>
      ) : null}

      {rows.map((row) => (
        <RecentSetCard key={row.id} row={row} />
      ))}
    </Screen>
  );
}

function RecentSetCard({ row }: { row: RecentSetRow }) {
  const videoStatus = row.video?.availabilityStatus ?? 'none';

  return (
    <Card onPress={() => router.push(setDetailHref(row.id))}>
      <View style={styles.setRow}>
        <View style={styles.setMain}>
          <AppText variant="dataLarge">
            {formatSetLabel(row.weight, row.reps)}
          </AppText>
          <VideoBadge status={videoStatus} compact />
        </View>
        <AppText variant="body">{row.exerciseName}</AppText>
        <AppText variant="caption" muted>
          {row.sessionName ? row.sessionName : 'No workout'}
          {row.manufacturerName ? ` · ${row.manufacturerName}` : ''}
          {' · '}
          {formatPerformedAt(row.performedAt)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  setRow: {
    gap: spacing.xs,
  },
  setMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
