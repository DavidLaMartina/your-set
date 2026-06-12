import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DenseInput } from '@/components/dense-input';
import { PrimaryButton } from '@/components/primary-button';
import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import type { Manufacturer, SetListFilters } from '@/types/domain';

/** UI-side filter state (strings for inputs). Convert with {@link setFilterValuesToQuery}. */
export type SetFilterValues = {
  /** ISO at start of the selected "from" day, or null for no lower bound. */
  dateFrom: string | null;
  /** ISO at start of the selected "to" day, or null for no upper bound. */
  dateTo: string | null;
  weightMin: string;
  weightMax: string;
  repsMin: string;
  repsMax: string;
  hasVideo: boolean;
  manufacturerId: string | null;
};

export const EMPTY_SET_FILTERS: SetFilterValues = {
  dateFrom: null,
  dateTo: null,
  weightMin: '',
  weightMax: '',
  repsMin: '',
  repsMax: '',
  hasVideo: false,
  manufacturerId: null,
};

function parseNum(value: string): number | undefined {
  const n = Number(value.trim());
  return value.trim() !== '' && Number.isFinite(n) ? n : undefined;
}

function startOfNextDayIso(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

/** Translate UI state into a repository filter (omitting empty fields). */
export function setFilterValuesToQuery(v: SetFilterValues): Partial<SetListFilters> {
  const q: Partial<SetListFilters> = {};
  if (v.dateFrom) q.performedAtFrom = v.dateFrom;
  if (v.dateTo) q.performedAtTo = startOfNextDayIso(v.dateTo);
  const wMin = parseNum(v.weightMin);
  if (wMin != null) q.weightMin = wMin;
  const wMax = parseNum(v.weightMax);
  if (wMax != null) q.weightMax = wMax;
  const rMin = parseNum(v.repsMin);
  if (rMin != null) q.repsMin = rMin;
  const rMax = parseNum(v.repsMax);
  if (rMax != null) q.repsMax = rMax;
  if (v.hasVideo) q.hasVideo = true;
  if (v.manufacturerId) q.manufacturerId = v.manufacturerId;
  return q;
}

export function countActiveSetFilters(v: SetFilterValues): number {
  let n = 0;
  if (v.dateFrom || v.dateTo) n += 1;
  if (v.weightMin.trim() || v.weightMax.trim()) n += 1;
  if (v.repsMin.trim() || v.repsMax.trim()) n += 1;
  if (v.hasVideo) n += 1;
  if (v.manufacturerId) n += 1;
  return n;
}

type Props = {
  value: SetFilterValues;
  onChange: (next: SetFilterValues) => void;
  manufacturers: Manufacturer[];
};

export function SetFilters({ value, onChange, manufacturers }: Props) {
  const [open, setOpen] = useState(false);
  const active = countActiveSetFilters(value);
  const patch = (partial: Partial<SetFilterValues>) => onChange({ ...value, ...partial });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        accessibilityRole="button">
        <View style={styles.headerLeft}>
          <AppText variant="label">Filters</AppText>
          {active > 0 ? (
            <View style={styles.badge}>
              <AppText variant="caption" color={colors.text.inverse}>
                {active}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          {active > 0 ? (
            <Pressable onPress={() => onChange(EMPTY_SET_FILTERS)} hitSlop={8}>
              <AppText variant="caption" color={colors.accent.secondary}>
                Clear
              </AppText>
            </Pressable>
          ) : null}
          <AppText variant="caption" muted>
            {open ? '▴' : '▾'}
          </AppText>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <DateRange
            from={value.dateFrom}
            to={value.dateTo}
            onChange={(dateFrom, dateTo) => patch({ dateFrom, dateTo })}
          />

          <View style={styles.rangeRow}>
            <DenseInput
              label="Weight min"
              value={value.weightMin}
              onChangeText={(weightMin) => patch({ weightMin })}
              placeholder="—"
            />
            <DenseInput
              label="Weight max"
              value={value.weightMax}
              onChangeText={(weightMax) => patch({ weightMax })}
              placeholder="—"
            />
            <DenseInput
              label="Reps min"
              value={value.repsMin}
              onChangeText={(repsMin) => patch({ repsMin })}
              placeholder="—"
            />
            <DenseInput
              label="Reps max"
              value={value.repsMax}
              onChangeText={(repsMax) => patch({ repsMax })}
              placeholder="—"
            />
          </View>

          <Pressable
            onPress={() => patch({ hasVideo: !value.hasVideo })}
            style={[styles.toggle, value.hasVideo && styles.toggleOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: value.hasVideo }}>
            <AppText
              variant="body"
              color={value.hasVideo ? colors.accent.primary : colors.text.secondary}>
              {value.hasVideo ? '✓ ' : ''}Has video
            </AppText>
          </Pressable>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" muted>
              Manufacturer
            </AppText>
            <ManufacturerFilterDropdown
              manufacturers={manufacturers}
              value={value.manufacturerId}
              onSelect={(manufacturerId) => patch({ manufacturerId })}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function DateRange({
  from,
  to,
  onChange,
}: {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  const [picker, setPicker] = useState<null | 'from' | 'to'>(null);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) return;
    const d = new Date(selected);
    d.setHours(0, 0, 0, 0);
    if (picker === 'from') onChange(d.toISOString(), to);
    else if (picker === 'to') onChange(from, d.toISOString());
  };

  const pickerValue = picker === 'to' ? to : from;

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.dateLabelRow}>
        <AppText variant="caption" muted>
          Date range
        </AppText>
        {from || to ? (
          <Pressable onPress={() => onChange(null, null)} hitSlop={8}>
            <AppText variant="caption" color={colors.accent.secondary}>
              Clear dates
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.dateRow}>
        <Pressable
          onPress={() => setPicker((p) => (p === 'from' ? null : 'from'))}
          style={styles.dateField}>
          <AppText variant="body" color={from ? colors.text.primary : colors.text.muted}>
            {from ? formatDay(from) : 'From'}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setPicker((p) => (p === 'to' ? null : 'to'))}
          style={styles.dateField}>
          <AppText variant="body" color={to ? colors.text.primary : colors.text.muted}>
            {to ? formatDay(to) : 'To'}
          </AppText>
        </Pressable>
      </View>
      {picker ? (
        <View style={styles.pickerPanel}>
          <DateTimePicker
            value={pickerValue ? new Date(pickerValue) : new Date()}
            mode="date"
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

function ManufacturerFilterDropdown({
  manufacturers,
  value,
  onSelect,
}: {
  manufacturers: Manufacturer[];
  value: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = manufacturers.find((m) => m.id === value) ?? null;

  const choose = (id: string | null) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.dropdownField}
        accessibilityRole="button">
        <AppText variant="body" color={selected ? colors.text.primary : colors.text.muted}>
          {selected ? selected.name : 'Any'}
        </AppText>
        <AppText variant="caption" muted>
          {open ? '▴' : '▾'}
        </AppText>
      </Pressable>
      {open ? (
        <View style={styles.dropdownPanel}>
          <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => choose(null)} style={styles.dropdownOption}>
              <AppText variant="body" muted>
                Any
              </AppText>
            </Pressable>
            {manufacturers.map((m) => (
              <Pressable key={m.id} onPress={() => choose(m.id)} style={styles.dropdownOption}>
                <AppText
                  variant="body"
                  color={m.id === value ? colors.accent.primary : colors.text.primary}>
                  {m.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    minHeight: 44,
  },
  pickerPanel: {
    gap: spacing.sm,
  },
  toggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.subtle,
  },
  toggleOn: {
    borderColor: colors.accent.primary,
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
  dropdownList: {
    maxHeight: 220,
  },
  dropdownOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
