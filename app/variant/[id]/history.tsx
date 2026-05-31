import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetTypeBadge } from '@/components/set-type-badge';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel, getMockVariantHistory } from '@/features/mock-data';
import { setCompareHref, setDetailHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';
import type { HistorySetRow } from '@/types/domain';

export default function VariantHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = id ? getMockVariantHistory(id) : null;

  if (!history) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Not found" />
        <AppText muted>No variant for this id.</AppText>
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
        {row.workoutId ? (row.workoutName ? ` · ${row.workoutName}` : ' · Session') : ' · No session'}
        {row.rir != null ? ` · RIR ${row.rir}` : ''}
      </AppText>
      {row.video?.availabilityStatus === 'available' ? (
        <AppText
          variant="label"
          color={colors.accent.secondary}
          onPress={() => router.push(setCompareHref(row.id))}>
          Compare video
        </AppText>
      ) : null}
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
