import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SetListCard } from '@/components/set-list-card';
import {
  EMPTY_SET_FILTERS,
  SetFilters,
  countActiveSetFilters,
  setFilterValuesToQuery,
  type SetFilterValues,
} from '@/components/set-filters';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import { deleteExercise } from '@/features/exercises/services/library-service';
import { deleteLoggedSet } from '@/features/sets/services/set-log-service';
import { listRecentSets, type RecentSetRow } from '@/features/sets/services/recent-sets-service';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import { confirmDestructive } from '@/lib/confirm-delete';
import { setDeleteNeedsConfirmation } from '@/lib/set-delete';
import { formatSetLabel } from '@/lib/format';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import { editExerciseHref, logSetHref } from '@/lib/navigation';
import type { ExerciseWithMeta, Manufacturer } from '@/types/domain';

export default function ExerciseDetailScreen() {
  const { exerciseId: id } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<ExerciseWithMeta | null>(null);
  const [sets, setSets] = useState<RecentSetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SetFilterValues>(EMPTY_SET_FILTERS);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const activeFilters = countActiveSetFilters(filters);
  const query = useMemo(() => setFilterValuesToQuery(filters), [filters]);

  useEffect(() => {
    void ReferenceRepo.listManufacturers().then(setManufacturers);
  }, []);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [meta, rows] = await Promise.all([
        ExerciseRepo.getExerciseWithMeta(id),
        listRecentSets({ ...query, exerciseId: id }),
      ]);
      setExercise(meta);
      setSets(rows);
    } finally {
      setLoading(false);
    }
  }, [id, query]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleDeleteSet = useCallback(
    (setId: string) => {
      const row = sets.find((r) => r.id === setId);
      if (!row || row.sessionInstanceId != null) return;

      const remove = async () => {
        await deleteLoggedSet(setId);
        await refresh();
      };

      if (setDeleteNeedsConfirmation(row)) {
        confirmDestructive({
          title: `Delete ${formatSetLabel(row.weight, row.reps)}?`,
          message: 'This set has notes or a video attached.',
          onConfirm: remove,
        });
        return;
      }

      void remove();
    },
    [sets, refresh],
  );

  if (!id) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Exercise" />
        <AppText muted>Missing exercise id.</AppText>
      </Screen>
    );
  }

  if (loading && !exercise) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Exercise" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Not found" />
        <AppText muted>Exercise not found.</AppText>
      </Screen>
    );
  }

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
      {exercise.notes ? (
        <AppText variant="caption" muted>
          {exercise.notes}
        </AppText>
      ) : null}

      <PrimaryButton label="+ Log set" onPress={() => router.push(logSetHref({ exerciseId: id }))} />

      <SetFilters value={filters} onChange={setFilters} manufacturers={manufacturers} />

      {loading && sets.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && sets.length === 0 ? (
        <AppText variant="body" muted>
          {activeFilters > 0
            ? 'No sets match these filters.'
            : 'No sets logged yet for this exercise.'}
        </AppText>
      ) : null}

      {sets.map((row) => (
        <SetListCard
          key={row.id}
          row={row}
          showExerciseName={false}
          onDelete={handleDeleteSet}
        />
      ))}

      <PrimaryButton
        label="Edit exercise"
        variant="ghost"
        onPress={() => router.push(editExerciseHref(exercise.id))}
      />
      <PrimaryButton label="Delete exercise" variant="danger" onPress={handleDelete} />
    </Screen>
  );
}
