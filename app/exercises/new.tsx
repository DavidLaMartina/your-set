import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import {
  createExercise,
  getExerciseWithMeta,
  loadExerciseFormOptions,
  updateExercise,
  type ExerciseFormOptions,
} from '@/features/exercises/services/library-service';
import { exerciseDetailHref } from '@/lib/navigation';
import { colors, radius, spacing } from '@/lib/theme/tokens';

export default function ExerciseFormScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const isEdit = Boolean(exerciseId);

  const [options, setOptions] = useState<ExerciseFormOptions | null>(null);
  const [name, setName] = useState('');
  const [implementId, setImplementId] = useState<string | null>(null);
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string | null>(null);
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOptions(await loadExerciseFormOptions());
      if (exerciseId) {
        const existing = await getExerciseWithMeta(exerciseId);
        if (existing) {
          setName(existing.name);
          setImplementId(existing.implementId);
          setPrimaryMuscleId(existing.primaryMuscleId);
          setSecondaryMuscleIds(existing.secondaryMuscles.map((m) => m.id));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSecondary = (id: string) => {
    setSecondaryMuscleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const secondaries = secondaryMuscleIds.filter((id) => id !== primaryMuscleId);
      if (isEdit && exerciseId) {
        await updateExercise(exerciseId, {
          name: trimmed,
          implementId,
          primaryMuscleId,
          secondaryMuscleIds: secondaries,
        });
        router.replace(exerciseDetailHref(exerciseId));
      } else {
        const exercise = await createExercise({
          name: trimmed,
          implementId,
          primaryMuscleId,
          secondaryMuscleIds: secondaries,
        });
        router.replace(exerciseDetailHref(exercise.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setSaving(false);
    }
  };

  if (loading || !options) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title={isEdit ? 'Edit exercise' : 'New exercise'} />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <StackHeader title={isEdit ? 'Edit exercise' : 'New exercise'} />
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Smith high incline press"
      />

      <ChipGroup
        label="Implement"
        options={options.implements.map((i) => ({ id: i.id, label: i.name }))}
        selectedId={implementId}
        onSelect={(id) => setImplementId(id)}
        allowNone
      />

      <ChipGroup
        label="Primary muscle"
        options={options.muscles.map((m) => ({ id: m.id, label: m.name }))}
        selectedId={primaryMuscleId}
        onSelect={(id) => setPrimaryMuscleId(id)}
        allowNone
      />

      <MultiChipGroup
        label="Secondary muscles (optional)"
        options={options.muscles
          .filter((m) => m.id !== primaryMuscleId)
          .map((m) => ({ id: m.id, label: m.name }))}
        selectedIds={secondaryMuscleIds}
        onToggle={toggleSecondary}
      />

      {error ? (
        <AppText variant="caption" color="#E5484D">
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save exercise'}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

type ChipOption = { id: string; label: string };

function ChipGroup({
  label,
  options,
  selectedId,
  onSelect,
  allowNone,
}: {
  label: string;
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label" muted>
        {label}
      </AppText>
      <View style={styles.chips}>
        {allowNone ? (
          <Chip
            label="None"
            active={selectedId == null}
            onPress={() => onSelect(null)}
          />
        ) : null}
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={selectedId === opt.id}
            onPress={() => onSelect(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

function MultiChipGroup({
  label,
  options,
  selectedIds,
  onToggle,
}: {
  label: string;
  options: ChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label" muted>
        {label}
      </AppText>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={selectedIds.includes(opt.id)}
            onPress={() => onToggle(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <AppText
        variant="caption"
        color={active ? colors.text.inverse : colors.text.secondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  actions: {
    marginTop: spacing.md,
  },
});
