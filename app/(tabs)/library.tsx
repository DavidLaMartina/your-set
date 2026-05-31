import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/ui/app-text';
import {
  loadLibrary,
  type ExerciseWithVariants,
} from '@/features/exercises/services/library-service';
import { exerciseDetailHref, newExerciseHref, variantHistoryHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';

export default function LibraryScreen() {
  const [library, setLibrary] = useState<ExerciseWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLibrary(await loadLibrary());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Library</AppText>
        <AppText variant="caption" muted>
          Exercises and variants — stored locally
        </AppText>
      </View>

      <PrimaryButton label="+ Exercise" onPress={() => router.push(newExerciseHref())} />

      {loading && library.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && library.length === 0 ? (
        <AppText variant="body" muted>
          No exercises yet. Add your first exercise.
        </AppText>
      ) : null}

      {library.map(({ exercise, variants }) => (
        <Card
          key={exercise.id}
          title={exercise.name}
          subtitle={exercise.defaultMuscleGroup ?? undefined}
          onHeaderPress={() => router.push(exerciseDetailHref(exercise.id))}
          headerRight={
            <AppText variant="caption" color={colors.accent.secondary}>
              Manage →
            </AppText>
          }>
          <View style={styles.variantList}>
            {variants.length === 0 ? (
              <AppText variant="caption" muted>
                No variants — open exercise to add
              </AppText>
            ) : (
              variants.map((variant) => (
                <AppText
                  key={variant.id}
                  variant="body"
                  color={colors.accent.secondary}
                  onPress={() => router.push(variantHistoryHref(variant.id))}>
                  {variant.name}
                  {variant.equipment ? ` · ${variant.equipment}` : ''}
                </AppText>
              ))
            )}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  variantList: {
    gap: spacing.md,
  },
});
