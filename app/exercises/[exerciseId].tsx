import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetTypeBadge } from '@/components/set-type-badge';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import { loadExerciseHistory } from '@/features/history/services/exercise-history-service';
import { deleteExercise } from '@/features/exercises/services/library-service';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { editExerciseHref, logSetHref, setDetailHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import type { ExerciseHistoryView, HistorySetRow } from '@/types/domain';

export default function ExerciseDetailScreen() {
  const { exerciseId: id } = useLocalSearchParams<{ exerciseId: string }>();
  const [view, setView] = useState<ExerciseHistoryView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setView(await loadExerciseHistory(id));
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
        <StackHeader title="Exercise" />
        <AppText muted>Missing exercise id.</AppText>
      </Screen>
    );
  }

  if (loading && !view) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Exercise" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!view) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Not found" />
        <AppText muted>Exercise not found.</AppText>
      </Screen>
    );
  }

  const { exercise, recentSets, bestSets, comparableSets } = view;
  const subtitle =
    [exercise.implementName, exercise.primaryMuscleName].filter(Boolean).join(' · ') || undefined;

  const handleDelete = () => {
    Alert.alert('Delete exercise?', 'This removes the exercise and all of its sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(exercise.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <StackHeader title={exercise.name} subtitle={subtitle} />

      {exercise.secondaryMuscles.length > 0 ? (
        <AppText variant="caption" muted>
          Also hits {exercise.secondaryMuscles.map((m) => m.name).join(', ')}
        </AppText>
      ) : null}
      {exercise.manufacturerName ? (
        <AppText variant="caption" muted>
          {exercise.manufacturerName}
        </AppText>
      ) : null}
      {exercise.notes ? (
        <AppText variant="caption" muted>
          {exercise.notes}
        </AppText>
      ) : null}

      <PrimaryButton label="+ Log set" onPress={() => router.push(logSetHref({ exerciseId: id }))} />

      <HistorySection title="Recent sets" sets={recentSets} />
      <HistorySection title="Best sets" sets={bestSets} />
      <HistorySection
        title="Comparable"
        sets={comparableSets}
        subtitle="Top sets, similar load"
      />

      <PrimaryButton
        label="Edit exercise"
        variant="ghost"
        onPress={() => router.push(editExerciseHref(exercise.id))}
      />
      <PrimaryButton label="Delete exercise" variant="danger" onPress={handleDelete} />
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
          : ' · No workout'}
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
