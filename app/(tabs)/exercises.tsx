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
import { formatDate } from '@/lib/format';
import { exerciseDetailHref, newExerciseHref } from '@/lib/navigation';
import { colors } from '@/lib/theme/tokens';

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

      {items.map(({ exercise, implementName, primaryMuscleName, lastPerformedAt, setCount }) => {
        const tags = [implementName, primaryMuscleName].filter(Boolean).join(' · ');
        return (
          <Card
            key={exercise.id}
            title={exercise.name}
            subtitle={tags || undefined}
            onPress={() => router.push(exerciseDetailHref(exercise.id))}
            headerRight={
              <AppText variant="caption" color={colors.accent.secondary}>
                →
              </AppText>
            }>
            <AppText variant="caption" muted>
              {lastPerformedAt
                ? `Last performed ${formatDate(lastPerformedAt)} · ${setCount} set${setCount === 1 ? '' : 's'}`
                : 'No sets logged yet'}
            </AppText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
});
