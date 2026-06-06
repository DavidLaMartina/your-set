import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DenseInput } from '@/components/dense-input';
import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, typography } from '@/lib/theme/tokens';
import type { LogSetFormValues } from '@/features/sets/services/set-log-service';
import { SET_TYPES, SET_TYPE_LABELS } from '@/types/domain';

type Props = {
  values: LogSetFormValues;
  onChange: (next: LogSetFormValues) => void;
};

export function LogSetForm({ values, onChange }: Props) {
  const patch = (partial: Partial<LogSetFormValues>) => onChange({ ...values, ...partial });

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <DenseInput
          label="Weight"
          value={values.weight}
          onChangeText={(weight) => patch({ weight })}
          placeholder="lb"
        />
        <DenseInput
          label="Reps"
          value={values.reps}
          onChangeText={(reps) => patch({ reps })}
          placeholder="reps"
        />
        <DenseInput
          label="RIR"
          value={values.rir}
          onChangeText={(rir) => patch({ rir })}
          placeholder="—"
        />
      </View>

      <AppText variant="caption" muted>
        Set type
      </AppText>
      <View style={styles.chips}>
        {SET_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => patch({ setType: type })}
            style={[styles.chip, values.setType === type && styles.chipActive]}>
            <AppText
              variant="caption"
              color={values.setType === type ? colors.text.inverse : colors.text.secondary}>
              {SET_TYPE_LABELS[type]}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" muted>
        Notes
      </AppText>
      <TextInput
        style={styles.notes}
        value={values.notes}
        onChangeText={(notes) => patch({ notes })}
        placeholder="Optional"
        placeholderTextColor={colors.text.muted}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
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
  notes: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
