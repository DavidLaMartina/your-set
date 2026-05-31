import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, typography } from '@/lib/theme/tokens';

type DenseInputProps = {
  label?: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'numeric' | 'default';
};

export function DenseInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = 'numeric',
}: DenseInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="caption" muted>
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[styles.input, !editable && styles.readonly]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        editable={editable}
        keyboardType={keyboardType}
        selectTextOnFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    minWidth: 56,
  },
  input: {
    ...typography.dataMono,
    color: colors.text.primary,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 40,
    textAlign: 'center',
  },
  readonly: {
    opacity: 0.85,
  },
});
