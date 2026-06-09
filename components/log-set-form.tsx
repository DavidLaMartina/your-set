import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DenseInput } from '@/components/dense-input';
import { PrimaryButton } from '@/components/primary-button';
import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, typography } from '@/lib/theme/tokens';
import type { LogSetFormValues } from '@/features/sets/services/set-log-service';
import type { Manufacturer } from '@/types/domain';

type Props = {
  values: LogSetFormValues;
  onChange: (next: LogSetFormValues) => void;
  manufacturers: Manufacturer[];
  /** Surface the manufacturer dropdown (machine / Smith only). */
  showManufacturer?: boolean;
};

export function LogSetForm({ values, onChange, manufacturers, showManufacturer }: Props) {
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
      </View>

      <DateTimeField
        performedAt={values.performedAt}
        onChange={(performedAt) => patch({ performedAt })}
      />

      {showManufacturer ? (
        <View style={styles.fieldGroup}>
          <AppText variant="caption" muted>
            Manufacturer
          </AppText>
          <ManufacturerDropdown
            manufacturers={manufacturers}
            value={values.manufacturerId}
            onSelect={(manufacturerId) => patch({ manufacturerId })}
          />
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
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
    </View>
  );
}

function DateTimeField({
  performedAt,
  onChange,
}: {
  performedAt: string;
  onChange: (iso: string) => void;
}) {
  const [picker, setPicker] = useState<null | 'date' | 'time'>(null);
  const date = new Date(performedAt);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) return;
    onChange(selected.toISOString());
  };

  return (
    <View style={styles.fieldGroup}>
      <AppText variant="caption" muted>
        Performed
      </AppText>
      <View style={styles.dateTimeRow}>
        <Pressable
          onPress={() => setPicker((p) => (p === 'date' ? null : 'date'))}
          style={[styles.pickerField, styles.dateField]}>
          <AppText variant="body">
            {date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setPicker((p) => (p === 'time' ? null : 'time'))}
          style={[styles.pickerField, styles.timeField]}>
          <AppText variant="body">
            {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </AppText>
        </Pressable>
      </View>
      {picker ? (
        <View style={styles.pickerPanel}>
          <DateTimePicker
            value={date}
            mode={picker}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <PrimaryButton label="Done" variant="ghost" onPress={() => setPicker(null)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ManufacturerDropdown({
  manufacturers,
  value,
  onSelect,
}: {
  manufacturers: Manufacturer[];
  value: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = manufacturers.find((m) => m.id === value) ?? null;
  const filtered = query.trim()
    ? manufacturers.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
    : manufacturers;

  const choose = (id: string | null) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.dropdownField}
        accessibilityRole="button">
        <AppText variant="body" color={selected ? colors.text.primary : colors.text.muted}>
          {selected ? selected.name : 'None'}
        </AppText>
        <AppText variant="caption" muted>
          {open ? '▴' : '▾'}
        </AppText>
      </Pressable>
      {open ? (
        <View style={styles.dropdownPanel}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search manufacturers…"
            placeholderTextColor={colors.text.muted}
            autoFocus
          />
          <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => choose(null)} style={styles.dropdownOption}>
              <AppText variant="body" muted>
                None
              </AppText>
            </Pressable>
            {filtered.map((m) => (
              <Pressable key={m.id} onPress={() => choose(m.id)} style={styles.dropdownOption}>
                <AppText
                  variant="body"
                  color={m.id === value ? colors.accent.primary : colors.text.primary}>
                  {m.name}
                </AppText>
              </Pressable>
            ))}
            {filtered.length === 0 ? (
              <View style={styles.dropdownOption}>
                <AppText variant="caption" muted>
                  No matches
                </AppText>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
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
  fieldGroup: {
    gap: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerField: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    minHeight: 44,
  },
  dateField: {
    flex: 2,
  },
  timeField: {
    flex: 1,
  },
  pickerPanel: {
    gap: spacing.sm,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  dropdownPanel: {
    marginTop: spacing.xs,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  search: {
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
