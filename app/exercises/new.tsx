import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import { createExercise } from '@/features/exercises/services/library-service';
import { exerciseDetailHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';

export default function NewExerciseScreen() {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const exercise = await createExercise({
        name: trimmed,
        defaultMuscleGroup: muscleGroup.trim() || null,
      });
      router.replace(exerciseDetailHref(exercise.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <StackHeader title="New exercise" />
      <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Incline Press" />
      <FormField
        label="Default muscle group (optional)"
        value={muscleGroup}
        onChangeText={setMuscleGroup}
        placeholder="e.g. chest"
      />
      {error ? (
        <AppText variant="caption" color="#E5484D">
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save exercise'}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: spacing.md,
  },
});
