import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { LogSetForm } from '@/components/log-set-form';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetVideoSection } from '@/components/set-video-section';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { loadSetWithContext } from '@/features/history/services/exercise-history-service';
import {
  formValuesToLogInput,
  logSetFormFromSet,
  updateLoggedSet,
  type LogSetFormValues,
} from '@/features/sets/services/set-log-service';
import {
  attachVideoToSet,
  removeVideoFromSet,
  resolveAndPersistSetVideo,
} from '@/features/video/services/set-video-service';
import * as ExerciseRepo from '@/lib/db/repositories/exercise-repository';
import * as ReferenceRepo from '@/lib/db/repositories/reference-repository';
import { setCompareHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import { implementUsesManufacturer } from '@/types/domain';
import type { HistorySetRow, Manufacturer, SetVideo } from '@/types/domain';

type Mode = 'view' | 'edit';

export default function SetDetailScreen() {
  const { id, edit, returnTo } = useLocalSearchParams<{
    id: string;
    edit?: string;
    returnTo?: 'workout' | 'sets';
  }>();
  const returnToWorkout = returnTo === 'workout';
  const [set, setSet] = useState<HistorySetRow | null>(null);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showManufacturer, setShowManufacturer] = useState(false);
  const [form, setForm] = useState<LogSetFormValues | null>(null);
  const [mode, setMode] = useState<Mode>(edit === '1' ? 'edit' : 'view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const applyVideo = useCallback((video: SetVideo | null) => {
    setSet((prev) => (prev ? { ...prev, video } : prev));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [row, mfrs] = await Promise.all([loadSetWithContext(id), ReferenceRepo.listManufacturers()]);
      if (cancelled) return;
      setSet(row);
      setManufacturers(mfrs);
      if (row) {
        setForm(logSetFormFromSet(row));
        const exercise = await ExerciseRepo.getExerciseById(row.exerciseId);
        if (!cancelled) setShowManufacturer(implementUsesManufacturer(exercise?.implementId));
      }
      setLoading(false);
      if (row?.video) {
        const refreshed = await resolveAndPersistSetVideo(id);
        if (!cancelled) applyVideo(refreshed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, applyVideo]);

  const handleAttach = useCallback(async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      const result = await attachVideoToSet(id);
      if (result.ok) {
        applyVideo(result.video);
        if (result.capturedAt) {
          if (mode === 'edit') {
            setForm((prev) =>
              prev ? { ...prev, performedAt: result.capturedAt! } : prev,
            );
          } else if (set) {
            await updateLoggedSet(id, {
              exerciseId: set.exerciseId,
              performedAt: result.capturedAt,
            });
            const refreshed = await loadSetWithContext(id);
            if (refreshed) {
              setSet(refreshed);
              setForm(logSetFormFromSet(refreshed));
            }
          }
        }
      } else if (result.reason === 'permissionDenied') {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access in Settings to attach a video.',
        );
      }
    } finally {
      setBusy(false);
    }
  }, [id, busy, applyVideo, mode, set]);

  const handleRemoveVideo = useCallback(() => {
    if (!id || busy) return;
    Alert.alert(
      'Remove video reference?',
      'This removes the link only; your video stays in Photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await removeVideoFromSet(id);
              applyVideo(null);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [id, busy, applyVideo]);

  const handleSave = useCallback(async () => {
    if (!id || !set || !form || saving) return;
    const hasWeight = form.weight.trim().length > 0;
    const hasReps = form.reps.trim().length > 0;
    if (!hasWeight && !hasReps) {
      Alert.alert('Add weight or reps', 'Enter at least one value to save this set.');
      return;
    }

    setSaving(true);
    try {
      const input = formValuesToLogInput(form, {
        exerciseId: set.exerciseId,
        sessionInstanceId: set.sessionInstanceId,
        sessionInstanceExerciseId: set.sessionInstanceExerciseId,
      });
      await updateLoggedSet(id, input);
      const refreshed = await loadSetWithContext(id);
      if (refreshed) {
        setSet(refreshed);
        setForm(logSetFormFromSet(refreshed));
      }
      if (returnToWorkout) {
        router.back();
      } else {
        setMode('view');
      }
    } finally {
      setSaving(false);
    }
  }, [id, set, form, saving, returnToWorkout]);

  const cancelEdit = useCallback(() => {
    if (returnToWorkout) {
      router.back();
      return;
    }
    if (set) setForm(logSetFormFromSet(set));
    setMode('view');
  }, [set, returnToWorkout]);

  if (loading) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!set) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>
          Set not found in the database. Reload the app if you still see this after a schema update.
        </AppText>
      </Screen>
    );
  }

  const videoSection = (
    <SetVideoSection
      video={set.video}
      busy={busy}
      onAttach={handleAttach}
      onRemove={handleRemoveVideo}
    />
  );

  if (mode === 'edit' && form) {
    return (
      <Screen>
        <StackHeader title="Edit set" subtitle={set.sessionName ?? undefined} />
        <LogSetForm
          values={form}
          onChange={setForm}
          manufacturers={manufacturers}
          showManufacturer={showManufacturer}
        />
        {videoSection}
        <View style={styles.actions}>
          <PrimaryButton
            label={saving ? 'Saving…' : 'Save changes'}
            onPress={() => void handleSave()}
          />
          <PrimaryButton label="Cancel" variant="ghost" onPress={cancelEdit} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title="Set detail" />
      <View style={styles.stats}>
        <AppText variant="titleLarge">{formatSetLabel(set.weight, set.reps)}</AppText>
      </View>

      <Metadata label="Performed" value={formatPerformedAt(set.performedAt)} />
      <Metadata
        label="Session"
        value={set.sessionInstanceId ? set.sessionName ?? 'In session' : 'None (set-only log)'}
      />
      {set.manufacturerName ? (
        <Metadata label="Manufacturer" value={set.manufacturerName} />
      ) : null}
      {set.notes ? <Metadata label="Notes" value={set.notes} /> : null}

      {videoSection}

      <PrimaryButton label="Edit set" variant="ghost" onPress={() => setMode('edit')} />
      <PrimaryButton
        label="Compare with prior set"
        onPress={() => router.push(setCompareHref(set.id))}
      />
    </Screen>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaRow: {
    gap: 2,
  },
  actions: {
    gap: spacing.sm,
  },
});
