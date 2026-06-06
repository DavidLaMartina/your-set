import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { LogSetForm } from '@/components/log-set-form';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import {
  createLoggedSet,
  emptyLogSetForm,
  formValuesToLogInput,
  logSetFormFromSet,
  updateLoggedSet,
  type LogSetFormValues,
} from '@/features/sets/services/set-log-service';
import * as SetRepo from '@/lib/db/repositories/set-repository';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import { setDetailHref, setsTabHref } from '@/lib/navigation';

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    exerciseId: string;
    sessionInstanceId?: string;
    sessionInstanceExerciseId?: string;
    setId?: string;
    returnTo?: 'sets';
  }>();

  const exerciseId = params.exerciseId;
  const setId = params.setId;
  const isEdit = Boolean(setId);

  const [title, setTitle] = useState<string>('Log set');
  const [subtitle, setSubtitle] = useState<string | undefined>();
  const [form, setForm] = useState<LogSetFormValues>(emptyLogSetForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!exerciseId) return;
    setLoading(true);
    try {
      const exercise = await ExerciseRepo.getExerciseById(exerciseId);
      if (!exercise) return;
      setTitle(isEdit ? 'Edit set' : 'Log set');
      setSubtitle(exercise.name);

      if (setId) {
        const existing = await SetRepo.getSetById(setId);
        if (existing) setForm(logSetFormFromSet(existing));
      }
    } finally {
      setLoading(false);
    }
  }, [exerciseId, setId, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!exerciseId) return;
    const weight = form.weight.trim();
    const reps = form.reps.trim();
    if (!weight && !reps) {
      Alert.alert('Add weight or reps', 'Enter at least one value to save this set.');
      return;
    }

    setSaving(true);
    try {
      const base = {
        exerciseId,
        sessionInstanceId: params.sessionInstanceId ?? null,
        sessionInstanceExerciseId: params.sessionInstanceExerciseId ?? null,
      };
      const input = formValuesToLogInput(form, base);

      if (isEdit && setId) {
        await updateLoggedSet(setId, input);
        router.replace(setDetailHref(setId));
      } else {
        const created = await createLoggedSet(input);
        if (params.sessionInstanceId) {
          router.back();
        } else if (params.returnTo === 'sets') {
          router.replace(setsTabHref());
        } else {
          router.replace(setDetailHref(created.id));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (!exerciseId) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Log set" />
        <AppText muted>Missing exercise.</AppText>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title={title} />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title={title} subtitle={subtitle} />
      {!params.sessionInstanceId ? (
        <AppText variant="caption" muted>
          Set-only log — not tied to an open workout.
        </AppText>
      ) : null}
      <LogSetForm values={form} onChange={setForm} />
      <View style={styles.actions}>
        <PrimaryButton
          label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save set'}
          onPress={() => void handleSave()}
        />
        <PrimaryButton label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
});
