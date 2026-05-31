import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/ui/app-text';
import {
  loadExercisesByRecency,
  type ExerciseWithRecency,
} from '@/features/exercises/services/exercises-tab-service';
import { formatDate, formatPerformedAt } from '@/lib/format';
import {
  exerciseDetailHref,
  newExerciseHref,
  variantHistoryHref,
} from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';

export default function ExercisesScreen() {
  const [items, setItems] = useState<ExerciseWithRecency[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await loadExercisesByRecency());
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
        <AppText variant="titleLarge">Exercises</AppText>
        <AppText variant="caption" muted>
          Sorted by most recently performed
        </AppText>
      </View>

      <PrimaryButton label="+ Exercise" onPress={() => router.push(newExerciseHref())} />

      {loading && items.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && items.length === 0 ? (
        <AppText variant="body" muted>
          No exercises yet. Add your first movement.
        </AppText>
      ) : null}

      {items.map(({ exercise, lastPerformedAt, variants }) => (
        <Card
          key={exercise.id}
          title={exercise.name}
          subtitle={
            lastPerformedAt
              ? `Last performed ${formatDate(lastPerformedAt)}`
              : exercise.defaultMuscleGroup ?? 'No sets logged'
          }
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
              variants.map(({ variant, lastPerformedAt: variantLast }) => (
                <View key={variant.id} style={styles.variantRow}>
                  <AppText
                    variant="body"
                    color={colors.accent.secondary}
                    onPress={() => router.push(variantHistoryHref(variant.id))}>
                    {variant.name}
                    {variant.equipment ? ` · ${variant.equipment}` : ''}
                  </AppText>
                  {variantLast ? (
                    <AppText variant="caption" muted>
                      {formatPerformedAt(variantLast)}
                    </AppText>
                  ) : (
                    <AppText variant="caption" muted>
                      No sets yet
                    </AppText>
                  )}
                </View>
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
  variantRow: {
    gap: 2,
  },
});
