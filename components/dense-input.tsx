import { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, typography } from '@/lib/theme/tokens';

type DenseInputProps = {
  label?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'numeric' | 'default';
};

export const DenseInput = forwardRef<TextInput, DenseInputProps>(function DenseInput(
  {
    label,
    value,
    onChangeText,
    onBlur,
    onFocus,
    onSubmitEditing,
    placeholder,
    editable = true,
    keyboardType = 'numeric',
  },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="caption" muted>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        style={[styles.input, !editable && styles.readonly]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        editable={editable}
        keyboardType={keyboardType}
        selectTextOnFocus
        returnKeyType="done"
      />
    </View>
  );
});

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
