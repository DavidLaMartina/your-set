import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/ui/app-text';
import { mockExerciseLibrary } from '@/features/mock-data';
import { variantHistoryHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';

export default function LibraryScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Library</AppText>
        <AppText variant="caption" muted>
          Exercises and variants — Phase 2 will add editing
        </AppText>
      </View>

      {mockExerciseLibrary.map(({ exercise, variants }) => (
        <Card key={exercise.id} title={exercise.name} subtitle={exercise.defaultMuscleGroup ?? undefined}>
          <View style={styles.variantList}>
            {variants.map((variant) => (
              <View key={variant.id}>
                <AppText
                  variant="body"
                  color={colors.accent.secondary}
                  onPress={() => router.push(variantHistoryHref(variant.id))}>
                  {variant.name}
                  {variant.equipment ? ` · ${variant.equipment}` : ''}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ))}

      <AppText variant="caption" muted style={styles.hint}>
        Tap Smith high incline to preview variant history.
      </AppText>
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
  hint: {
    marginTop: spacing.sm,
  },
});
