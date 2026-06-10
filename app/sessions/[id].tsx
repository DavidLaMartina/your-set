import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import {
  deleteSessionDefinition,
  getSessionDefinitionDeleteSummary,
  loadSessionDefinition,
  reactivateSessionDefinition,
  retireSessionDefinition,
} from '@/features/sessions/services/session-definitions-service';
import {
  loadPlannedExercises,
  movePlannedExercise,
  removePlannedExercise,
  type PlannedExerciseRow,
} from '@/features/sessions/services/session-lineup-service';
import { confirmArchiveSession, confirmDeleteArchivedSession } from '@/lib/confirm-delete';
import { formatExerciseDisplayName } from '@/lib/format';
import { exercisePickerHref } from '@/lib/navigation';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import { implementUsesManufacturer, type Session, type SessionExercise } from '@/types/domain';

export default function SessionDefinitionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [planned, setPlanned] = useState<PlannedExerciseRow[]>([]);
  const [stats, setStats] = useState<{ plannedCount: number; instanceCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const summary = await loadSessionDefinition(id);
      if (!summary) {
        setSession(null);
        return;
      }
      setSession(summary.session);
      setStats({ plannedCount: summary.plannedCount, instanceCount: summary.instanceCount });
      setPlanned(await loadPlannedExercises(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleRename = () => {
    if (!id || !session) return;
    Alert.prompt('Rename session', undefined, async (name) => {
      if (!name?.trim()) return;
      await SessionRepo.updateSession(id, { name: name.trim() });
      await refresh();
    });
  };

  const handleArchive = () => {
    if (!id || !session) return;
    confirmArchiveSession(session.name, async () => {
      await retireSessionDefinition(id);
      router.back();
    });
  };

  const handleDelete = () => {
    if (!id || !session) return;
    void (async () => {
      const summary = await getSessionDefinitionDeleteSummary(id);
      if (!summary) return;

      confirmDeleteArchivedSession(summary.name, summary.instanceCount, async () => {
        await deleteSessionDefinition(id);
        router.back();
      });
    })();
  };

  const handleSetManufacturer = (row: PlannedExerciseRow) => {
    void (async () => {
      const manufacturers = await ReferenceRepo.listManufacturers();
      const buttons = [
        ...manufacturers.map((m) => ({
          text: m.name,
          onPress: () =>
            void SessionExerciseRepo.updateSessionExerciseManufacturer(row.id, m.id).then(
              () => refresh(),
            ),
        })),
        {
          text: 'Clear',
          onPress: () =>
            void SessionExerciseRepo.updateSessionExerciseManufacturer(row.id, null).then(
              () => refresh(),
            ),
        },
        { text: 'Cancel', style: 'cancel' as const },
      ];
      Alert.alert('Default equipment', 'Sets in new workouts copy this brand.', buttons);
    })();
  };

  const handleRemovePlanned = (row: PlannedExerciseRow) => {
    Alert.alert(
      `Remove ${row.exerciseName}?`,
      'Future workouts will not include this exercise until you add it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void removePlannedExercise(row.id).then(() => refresh()),
        },
      ],
    );
  };

  if (!id) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Missing id.</AppText>
      </Screen>
    );
  }

  if (loading && !session) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Session definition not found.</AppText>
      </Screen>
    );
  }

  const isActive = session.status === 'active';

  return (
    <Screen>
      <StackHeader
        title={session.name}
        subtitle={isActive ? 'Active · rotation' : 'Archived'}
      />

      <View style={styles.meta}>
        <AppText variant="caption" muted>
          {stats?.instanceCount ?? 0} visit{(stats?.instanceCount ?? 0) === 1 ? '' : 's'} logged
        </AppText>
      </View>

      <PrimaryButton label="Rename" variant="ghost" onPress={handleRename} />
      {isActive ? (
        <PrimaryButton label="Archive session" variant="ghost" onPress={handleArchive} />
      ) : (
        <>
          <PrimaryButton
            label="Restore to rotation"
            variant="ghost"
            onPress={() =>
              void reactivateSessionDefinition(session.id).then(() => refresh())
            }
          />
          <PrimaryButton label="Delete permanently" variant="ghost" onPress={handleDelete} />
          <AppText variant="caption" muted>
            Deleting orphans {stats?.instanceCount ?? 0} linked workout
            {(stats?.instanceCount ?? 0) === 1 ? '' : 's'}; sets in your log are kept.
          </AppText>
        </>
      )}

      <AppText variant="titleMedium">Planned exercises</AppText>
      <AppText variant="caption" muted>
        New workouts started from this session copy this lineup.
      </AppText>

      {isActive ? (
        <PrimaryButton
          label="+ Add exercise"
          variant="ghost"
          onPress={() => router.push(exercisePickerHref('session-definition', id))}
        />
      ) : null}

      {planned.length === 0 ? (
        <AppText variant="body" muted>
          No planned exercises yet.
        </AppText>
      ) : null}

      {planned.map((row) => {
        const displayTitle = formatExerciseDisplayName(row.exerciseName, row.manufacturerName);
        const showManufacturer = implementUsesManufacturer(row.implementId);

        return (
        <Card
          key={row.id}
          title={displayTitle}
          headerRight={
            <AppText variant="caption" muted>
              #{row.sortOrder + 1}
            </AppText>
          }>
          <AppText variant="caption" muted>
            {formatPrescription(row)}
          </AppText>
          {showManufacturer && row.manufacturerName ? (
            <AppText variant="caption" muted>
              Equipment: {row.manufacturerName}
            </AppText>
          ) : null}
          {isActive ? (
            <View style={styles.rowActions}>
              {showManufacturer ? (
                <PrimaryButton
                  label={row.manufacturerName ? 'Change equipment' : 'Set equipment'}
                  variant="ghost"
                  onPress={() => handleSetManufacturer(row)}
                />
              ) : null}
              <PrimaryButton
                label="↑"
                variant="ghost"
                onPress={() =>
                  void movePlannedExercise(id, row.id, 'up').then(() => refresh())
                }
              />
              <PrimaryButton
                label="↓"
                variant="ghost"
                onPress={() =>
                  void movePlannedExercise(id, row.id, 'down').then(() => refresh())
                }
              />
              <PrimaryButton
                label="Remove"
                variant="ghost"
                onPress={() => handleRemovePlanned(row)}
              />
            </View>
          ) : null}
        </Card>
        );
      })}
    </Screen>
  );
}

function formatPrescription(row: SessionExercise): string {
  const parts: string[] = [];
  if (row.targetSets != null) parts.push(`${row.targetSets} sets`);
  if (row.targetRepsMin != null || row.targetRepsMax != null) {
    const min = row.targetRepsMin ?? row.targetRepsMax;
    const max = row.targetRepsMax ?? row.targetRepsMin;
    parts.push(min === max ? `${min} reps` : `${min}–${max} reps`);
  }
  if (row.targetWeight != null) parts.push(`${row.targetWeight} lb`);
  if (row.prescriptionNotes) parts.push(row.prescriptionNotes);
  return parts.length ? parts.join(' · ') : 'No default prescription';
}

const styles = StyleSheet.create({
  meta: {
    gap: 4,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
