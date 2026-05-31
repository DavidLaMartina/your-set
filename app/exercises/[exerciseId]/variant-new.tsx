import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import { createVariant } from '@/features/exercises/services/library-service';
import { exerciseDetailHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';

export default function NewVariantScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [setupNotes, setSetupNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!exerciseId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Variant name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createVariant({
        exerciseId,
        name: trimmed,
        equipment: equipment.trim() || null,
        muscleGroup: muscleGroup.trim() || null,
        setupNotes: setupNotes.trim() || null,
      });
      router.replace(exerciseDetailHref(exerciseId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <StackHeader title="New variant" />
      <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Smith high incline" />
      <FormField label="Equipment (optional)" value={equipment} onChangeText={setEquipment} />
      <FormField label="Muscle group (optional)" value={muscleGroup} onChangeText={setMuscleGroup} />
      <FormField
        label="Setup notes (optional)"
        value={setupNotes}
        onChangeText={setSetupNotes}
        placeholder="Bench angle, foot placement…"
      />
      {error ? (
        <AppText variant="caption" color="#E5484D">
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <PrimaryButton label={saving ? 'Saving…' : 'Save variant'} onPress={handleSave} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: spacing.md,
  },
});
