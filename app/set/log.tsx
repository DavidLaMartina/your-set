import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { LogSetForm } from '@/components/log-set-form';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SetVideoSection, type StagedVideo } from '@/components/set-video-section';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import {
  createLoggedSet,
  defaultManufacturerForExercise,
  emptyLogSetForm,
  formValuesToLogInput,
  type LogSetFormValues,
} from '@/features/sets/services/set-log-service';
import { persistPickedVideo } from '@/features/video/services/set-video-service';
import { pickVideoFromLibrary, type PickedVideo } from '@/lib/media/picker';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import { setDetailHref, setsTabHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import { implementUsesManufacturer } from '@/types/domain';
import type { Manufacturer } from '@/types/domain';

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    exerciseId: string;
    sessionInstanceId?: string;
    sessionInstanceExerciseId?: string;
    returnTo?: 'sets';
  }>();

  const exerciseId = params.exerciseId;

  const [subtitle, setSubtitle] = useState<string | undefined>();
  const [form, setForm] = useState<LogSetFormValues>(emptyLogSetForm());
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showManufacturer, setShowManufacturer] = useState(false);
  const [stagedVideo, setStagedVideo] = useState<PickedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!exerciseId) return;
    setLoading(true);
    try {
      const [exercise, mfrs, lastMfr] = await Promise.all([
        ExerciseRepo.getExerciseById(exerciseId),
        ReferenceRepo.listManufacturers(),
        defaultManufacturerForExercise(exerciseId),
      ]);
      if (!exercise) return;
      setManufacturers(mfrs);
      setSubtitle(exercise.name);
      setShowManufacturer(implementUsesManufacturer(exercise.implementId));
      setForm(emptyLogSetForm(lastMfr));
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAttach = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await pickVideoFromLibrary();
      if (result.ok) {
        setStagedVideo(result.video);
      } else if (result.reason === 'permissionDenied') {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access in Settings to attach a video.',
        );
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const staged: StagedVideo | null = stagedVideo
    ? { uri: stagedVideo.uri, width: stagedVideo.width, height: stagedVideo.height }
    : null;

  const handleSave = async () => {
    if (!exerciseId) return;
    const hasWeight = form.weight.trim().length > 0;
    const hasReps = form.reps.trim().length > 0;
    if (!hasWeight && !hasReps) {
      Alert.alert('Add weight or reps', 'Enter at least one value to save this set.');
      return;
    }

    setSaving(true);
    try {
      const input = formValuesToLogInput(form, {
        exerciseId,
        sessionInstanceId: params.sessionInstanceId ?? null,
        sessionInstanceExerciseId: params.sessionInstanceExerciseId ?? null,
      });
      const created = await createLoggedSet(input);

      if (stagedVideo) {
        try {
          await persistPickedVideo(created.id, stagedVideo);
        } catch {
          // Set is saved; video copy failed. The set screen will show the
          // attach CTA so the user can retry.
        }
      }

      if (params.sessionInstanceId) {
        router.back();
      } else if (params.returnTo === 'sets') {
        router.replace(setsTabHref());
      } else {
        router.replace(setDetailHref(created.id));
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
        <StackHeader title="Log set" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title="Log set" subtitle={subtitle} />
      {!params.sessionInstanceId ? (
        <AppText variant="caption" muted>
          Set-only log — not tied to an open workout.
        </AppText>
      ) : null}
      <LogSetForm
        values={form}
        onChange={setForm}
        manufacturers={manufacturers}
        showManufacturer={showManufacturer}
      />
      <SetVideoSection
        staged={staged}
        busy={busy}
        onAttach={handleAttach}
        onRemove={() => setStagedVideo(null)}
      />
      <View style={styles.actions}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save set'}
          onPress={() => void handleSave()}
        />
        <PrimaryButton label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});
