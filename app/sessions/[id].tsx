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
import { confirmArchiveSession, confirmDeleteArchivedSession } from '@/lib/confirm-delete';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import * as SessionExerciseRepo from '@/lib/db/repositories/session-exercise-repository';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as VariantRepo from '@/lib/db/repositories/exercise-variant-repository';
import type { Session, SessionExercise } from '@/types/domain';

type PlannedRow = SessionExercise & { variantName: string; exerciseName: string };

export default function SessionDefinitionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [planned, setPlanned] = useState<PlannedRow[]>([]);
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

      const exercises = await SessionExerciseRepo.listSessionExercises(id);
      const rows: PlannedRow[] = [];
      for (const row of exercises) {
        const variant = await VariantRepo.getVariantById(row.exerciseVariantId);
        const exercise = variant
          ? await ExerciseRepo.getExerciseById(variant.exerciseId)
          : null;
        rows.push({
          ...row,
          variantName: variant?.name ?? 'Unknown variant',
          exerciseName: exercise?.name ?? 'Unknown exercise',
        });
      }
      setPlanned(rows);
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

  return (
    <Screen>
      <StackHeader
        title={session.name}
        subtitle={session.status === 'active' ? 'Active · rotation' : 'Archived'}
      />

      <View style={styles.meta}>
        <AppText variant="caption" muted>
          {stats?.instanceCount ?? 0} visit{(stats?.instanceCount ?? 0) === 1 ? '' : 's'} logged
        </AppText>
      </View>

      <PrimaryButton label="Rename" variant="ghost" onPress={handleRename} />
      {session.status === 'active' ? (
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
      {planned.length === 0 ? (
        <AppText variant="body" muted>
          No planned exercises yet. Editing the lineup ships in a follow-up to 3a.
        </AppText>
      ) : null}
      {planned.map((row) => (
        <Card
          key={row.id}
          title={row.variantName}
          subtitle={row.exerciseName}
          headerRight={
            <AppText variant="caption" muted>
              #{row.sortOrder + 1}
            </AppText>
          }>
          <AppText variant="caption" muted>
            {formatPrescription(row)}
          </AppText>
        </Card>
      ))}
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
});
