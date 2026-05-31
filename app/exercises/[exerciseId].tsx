import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { AppText } from '@/components/ui/app-text';
import {
  deleteExercise,
  loadExerciseWithVariants,
  type ExerciseWithVariants,
} from '@/features/exercises/services/library-service';
import { newVariantHref, variantHistoryHref } from '@/lib/navigation';

export default function ExerciseDetailScreen() {
  const { exerciseId: id } = useLocalSearchParams<{ exerciseId: string }>();
  const [data, setData] = useState<ExerciseWithVariants | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setData(await loadExerciseWithVariants(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!id) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Exercise" />
        <AppText muted>Missing exercise id.</AppText>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Exercise" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  const { exercise, variants } = data;

  const handleDelete = () => {
    Alert.alert(
      'Delete exercise?',
      'This removes all variants and sets for this exercise.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExercise(exercise.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <StackHeader title={exercise.name} subtitle={exercise.defaultMuscleGroup ?? undefined} />
      <PrimaryButton
        label="+ Variant"
        onPress={() => router.push(newVariantHref(exercise.id))}
      />
      {variants.length === 0 ? (
        <AppText variant="body" muted>
          No variants yet.
        </AppText>
      ) : (
        variants.map((variant) => (
          <Card
            key={variant.id}
            title={variant.name}
            subtitle={[variant.equipment, variant.muscleGroup].filter(Boolean).join(' · ') || undefined}
            onPress={() => router.push(variantHistoryHref(variant.id))}>
            <AppText variant="caption" muted>
              View set history
            </AppText>
          </Card>
        ))
      )}
      <PrimaryButton label="Delete exercise" variant="danger" onPress={handleDelete} />
    </Screen>
  );
}
