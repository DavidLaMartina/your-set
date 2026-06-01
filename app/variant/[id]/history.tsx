import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetTypeBadge } from '@/components/set-type-badge';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { loadVariantHistory } from '@/features/history/services/variant-history-service';
import { setDetailHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import type { HistorySetRow, VariantHistoryView } from '@/types/domain';

export default function VariantHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [history, setHistory] = useState<VariantHistoryView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setHistory(await loadVariantHistory(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!id) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Not found" />
        <AppText muted>Missing variant id.</AppText>
      </Screen>
    );
  }

  if (loading && !history) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="History" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!history) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Not found" />
        <AppText muted>
          Variant not found. If you opened this from the Workout tab before a reload, go back and
          try again — IDs now come from the local database.
        </AppText>
      </Screen>
    );
  }

  const { variant, exercise, recentSets, bestSets, comparableSets } = history;

  return (
    <Screen>
      <StackHeader title={variant.name} subtitle={exercise.name} />
      {variant.setupNotes ? (
        <AppText variant="caption" muted>
          {variant.setupNotes}
        </AppText>
      ) : null}

      <HistorySection title="Recent sets" sets={recentSets} />
      <HistorySection title="Best sets" sets={bestSets} />
      <HistorySection title="Comparable" sets={comparableSets} subtitle="Same variant, similar load" />
    </Screen>
  );
}

function HistorySection({
  title,
  subtitle,
  sets,
}: {
  title: string;
  subtitle?: string;
  sets: HistorySetRow[];
}) {
  return (
    <View style={styles.section}>
      <AppText variant="titleMedium">{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" muted>
          {subtitle}
        </AppText>
      ) : null}
      {sets.length === 0 ? (
        <AppText variant="body" muted>
          No sets yet.
        </AppText>
      ) : (
        sets.map((row) => <HistorySetCard key={row.id} row={row} />)
      )}
    </View>
  );
}

function HistorySetCard({ row }: { row: HistorySetRow }) {
  const videoStatus = row.video?.availabilityStatus ?? 'none';

  return (
    <Card
      onPress={() => router.push(setDetailHref(row.id))}
      headerRight={<VideoBadge status={videoStatus} compact />}>
      <View style={styles.setRow}>
        <AppText variant="dataLarge">{formatSetLabel(row.weight, row.reps)}</AppText>
        {row.setType !== 'straight' ? <SetTypeBadge setType={row.setType} /> : null}
      </View>
      <AppText variant="caption" muted>
        {formatPerformedAt(row.performedAt)}
        {row.sessionInstanceId
          ? row.sessionName
            ? ` · ${row.sessionName}`
            : ' · Session'
          : ' · No session'}
        {row.rir != null ? ` · RIR ${row.rir}` : ''}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
