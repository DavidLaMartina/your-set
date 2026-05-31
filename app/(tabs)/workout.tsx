import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SetRow } from '@/components/set-row';
import { AppText } from '@/components/ui/app-text';
import { formatWorkoutElapsed } from '@/features/mock-data';
import { loadActiveWorkoutView } from '@/features/workouts/services/active-workout-service';
import { newExerciseHref, variantHistoryHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';
import type { ActiveWorkoutView } from '@/types/domain';

export default function ActiveWorkoutScreen() {
  const [workout, setWorkout] = useState<ActiveWorkoutView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setWorkout(await loadActiveWorkoutView());
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
      {loading && !workout ? (
        <AppText variant="body" muted>
          Loading workout…
        </AppText>
      ) : null}

      {!loading && !workout ? (
        <View style={styles.empty}>
          <AppText variant="titleMedium">No open workout</AppText>
          <AppText variant="body" muted>
            Seed data should include an open session. Pull to refresh by switching tabs, or add
            exercises in Library.
          </AppText>
          <PrimaryButton label="Go to Library" onPress={() => router.push('/(tabs)/library')} />
        </View>
      ) : null}

      {workout ? (
        <>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionMeta}>
              <AppText variant="titleLarge">{workout.name ?? 'Workout'}</AppText>
              <AppText variant="caption" muted>
                {formatWorkoutElapsed(workout.startedAt)}
                {workout.bodyweight != null ? ` · ${workout.bodyweight} lb` : ''}
              </AppText>
            </View>
            <PrimaryButton label="End" variant="ghost" onPress={() => {}} />
          </View>

          {workout.blocks.map((block) => (
            <Card
              key={block.id}
              title={block.variant.name}
              subtitle={block.exercise.name}
              onHeaderPress={() => router.push(variantHistoryHref(block.variant.id))}
              headerRight={
                <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
              }>
              {block.notes ? (
                <AppText variant="caption" muted>
                  {block.notes}
                </AppText>
              ) : null}
              <View style={styles.setList}>
                {block.sets.map((set, i) => (
                  <SetRow key={set.id} set={set} index={i + 1} />
                ))}
              </View>
              <PrimaryButton label="+ Set" variant="ghost" onPress={() => {}} />
            </Card>
          ))}

          <PrimaryButton
            label="+ Exercise"
            variant="ghost"
            onPress={() => router.push(newExerciseHref())}
          />
          <AppText variant="caption" muted>
            Phase 3 will add exercises to this session. Use Library to manage your catalog.
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sessionMeta: {
    flex: 1,
    gap: 4,
  },
  setList: {
    gap: spacing.xs,
  },
  empty: {
    gap: spacing.md,
  },
});
