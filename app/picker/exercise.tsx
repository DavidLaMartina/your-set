import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import { loadLibrary, type ExerciseLibraryRow } from '@/features/exercises/services/library-service';
import { addExerciseToSession } from '@/features/sessions/services/session-lineup-service';
import { ensureWorkoutBlock } from '@/features/sets/services/set-log-service';
import { logSetHref, newExerciseHref } from '@/lib/navigation';
import type { ExercisePickerPurpose } from '@/lib/navigation';

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{
    purpose: ExercisePickerPurpose;
    targetId?: string;
  }>();

  const [library, setLibrary] = useState<ExerciseLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLibrary(await loadLibrary());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSelect = async (exerciseId: string) => {
    if (!params.purpose) return;

    if (params.purpose === 'log-set') {
      router.replace(logSetHref({ exerciseId, returnTo: 'sets' }));
      return;
    }

    if (!params.targetId) return;

    if (params.purpose === 'session-definition') {
      const created = await addExerciseToSession(params.targetId, exerciseId);
      if (!created) {
        Alert.alert('Already in session', 'This exercise is already on the planned lineup.');
        return;
      }
    } else {
      await ensureWorkoutBlock(params.targetId, exerciseId);
    }

    router.back();
  };

  const purposeLabel =
    params.purpose === 'session-definition'
      ? 'Add to session lineup'
      : params.purpose === 'log-set'
        ? 'Log a set for this exercise'
        : 'Add to workout';

  const tapHint = params.purpose === 'log-set' ? 'Tap to log set' : 'Tap to add';

  if (!params.purpose || (params.purpose !== 'log-set' && !params.targetId)) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Pick exercise" />
        <AppText muted>Invalid picker parameters.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title="Pick exercise" subtitle={purposeLabel} />

      <PrimaryButton
        label="+ New exercise"
        variant="ghost"
        onPress={() => router.push(newExerciseHref())}
      />

      {loading ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}
      {!loading && library.length === 0 ? (
        <AppText variant="body" muted>
          No exercises yet. Add one to get started.
        </AppText>
      ) : null}
      {library.map(({ exercise, implementName, primaryMuscleName }) => (
        <Card
          key={exercise.id}
          title={exercise.name}
          subtitle={[implementName, primaryMuscleName].filter(Boolean).join(' · ') || undefined}
          onPress={() => void handleSelect(exercise.id)}>
          <AppText variant="caption" muted>
            {tapHint}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
