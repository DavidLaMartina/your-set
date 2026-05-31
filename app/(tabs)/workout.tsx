import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SetRow } from '@/components/set-row';
import { AppText } from '@/components/ui/app-text';
import { MOCK_IDS } from '@/features/mock-data/ids';
import { formatWorkoutElapsed, mockActiveWorkout } from '@/features/mock-data';
import { setCompareHref, variantHistoryHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';

export default function ActiveWorkoutScreen() {
  const workout = mockActiveWorkout;

  return (
    <Screen>
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
          onPress={() => router.push(variantHistoryHref(block.variant.id))}
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

      <PrimaryButton label="+ Exercise" onPress={() => {}} />

      <View style={styles.devLinks}>
        <AppText variant="caption" muted>
          Phase 1 — static mock
        </AppText>
        <AppText
          variant="label"
          color={colors.accent.secondary}
          onPress={() => router.push(setCompareHref(MOCK_IDS.setTodayTop))}>
          Open video compare (today vs prior)
        </AppText>
      </View>
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
  devLinks: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
});
