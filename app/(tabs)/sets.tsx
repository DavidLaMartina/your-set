import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { AppText } from '@/components/ui/app-text';
import { deleteLoggedSet } from '@/features/sets/services/set-log-service';
import { listRecentSets, type RecentSetRow } from '@/features/sets/services/recent-sets-service';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import { confirmDestructive } from '@/lib/confirm-delete';
import { setDeleteNeedsConfirmation } from '@/lib/set-delete';
import { formatSetLabel } from '@/lib/format';
import { exercisePickerForLogSetHref } from '@/lib/navigation';
import type { Manufacturer } from '@/types/domain';

export default function SetsScreen() {
  const [rows, setRows] = useState<RecentSetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SetFilterValues>(EMPTY_SET_FILTERS);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const activeFilters = countActiveSetFilters(filters);
  const query = useMemo(() => setFilterValuesToQuery(filters), [filters]);

  useEffect(() => {
    void ReferenceRepo.listManufacturers().then(setManufacturers);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listRecentSets(query));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleDeleteSet = useCallback(
    (setId: string) => {
      const row = rows.find((r) => r.id === setId);
      if (!row || row.sessionInstanceId != null) return;

      const remove = async () => {
        await deleteLoggedSet(setId);
        await refresh();
      };

      if (setDeleteNeedsConfirmation(row)) {
        const label = formatSetLabel(row.weight, row.reps);
        confirmDestructive({
          title: `Delete ${label}?`,
          message: row.exerciseName
            ? `${row.exerciseName} — this set has notes or a video attached.`
            : 'This set has notes or a video attached.',
          onConfirm: remove,
        });
        return;
      }

      void remove();
    },
    [rows, refresh],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Sets</AppText>
        <AppText variant="caption" muted>
          Recent logs — newest first. Swipe left to delete set-only logs; workout sets
          must be removed from the workout.
        </AppText>
      </View>

      <PrimaryButton
        label="+ Log set"
        onPress={() => router.push(exercisePickerForLogSetHref())}
      />

      <SetFilters value={filters} onChange={setFilters} manufacturers={manufacturers} />

      {loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          {activeFilters > 0
            ? 'No sets match these filters.'
            : 'No sets logged yet. Tap + Log set to record one.'}
        </AppText>
      ) : null}

      {rows.map((row) => (
        <SetListCard key={row.id} row={row} onDelete={handleDeleteSet} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
});
