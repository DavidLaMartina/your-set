import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, View, type View as ViewType } from 'react-native';

import { DenseInput } from '@/components/dense-input';
import { SwipeToDeleteRow } from '@/components/swipe-to-delete-row';
import { VideoBadge } from '@/components/video-badge';
import { AppText } from '@/components/ui/app-text';
import {
  createLoggedSet,
  parseOptionalFloat,
  parseOptionalInt,
  updateLoggedSet,
} from '@/features/sets/services/set-log-service';
import { colors, spacing } from '@/lib/theme/tokens';
import type { VideoAvailabilityStatus } from '@/types/domain';

export type WorkoutSetLogContext = {
  exerciseId: string;
  sessionInstanceId: string;
  sessionInstanceExerciseId: string;
};

type Props = {
  index: number;
  setId: string | null;
  initialWeight: number | null;
  initialReps: number | null;
  videoStatus: VideoAvailabilityStatus | 'none';
  editable: boolean;
  logContext: WorkoutSetLogContext;
  /** Focus weight after mount (new-set draft rows). */
  focusWeight?: boolean;
  onInputFocus?: (rowRef: RefObject<ViewType | null>) => void;
  onSaved: () => void;
  onOpenDetail: (setId: string) => void;
  /** Swipe delete — draft rows dismiss locally; saved rows delete from DB. */
  onDelete?: () => void;
};

function valuesFromSet(weight: number | null, reps: number | null) {
  return {
    weight: weight != null ? String(weight) : '',
    reps: reps != null ? String(reps) : '',
  };
}

export function WorkoutSetRow({
  index,
  setId,
  initialWeight,
  initialReps,
  videoStatus,
  editable,
  logContext,
  focusWeight,
  onInputFocus,
  onSaved,
  onOpenDetail,
  onDelete,
}: Props) {
  const [weight, setWeight] = useState(() => valuesFromSet(initialWeight, initialReps).weight);
  const [reps, setReps] = useState(() => valuesFromSet(initialWeight, initialReps).reps);
  const savingRef = useRef(false);
  const rowRef = useRef<ViewType>(null);
  const weightRef = useRef<TextInput>(null);

  const handleInputFocus = () => {
    onInputFocus?.(rowRef);
  };

  useEffect(() => {
    const next = valuesFromSet(initialWeight, initialReps);
    setWeight(next.weight);
    setReps(next.reps);
  }, [initialWeight, initialReps, setId]);

  useEffect(() => {
    if (!focusWeight || !editable) return;
    const timer = setTimeout(() => {
      weightRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [focusWeight, editable]);

  const persist = useCallback(async () => {
    if (!editable || savingRef.current) return;
    const parsedWeight = parseOptionalFloat(weight);
    const parsedReps = parseOptionalInt(reps);
    const hasValue = parsedWeight != null || parsedReps != null;

    if (!setId) {
      if (!hasValue) return;
      savingRef.current = true;
      try {
        await createLoggedSet({
          ...logContext,
          weight: parsedWeight,
          reps: parsedReps,
        });
        onSaved();
      } finally {
        savingRef.current = false;
      }
      return;
    }

    if (parsedWeight === initialWeight && parsedReps === initialReps) return;
    if (!hasValue) return;

    savingRef.current = true;
    try {
      await updateLoggedSet(setId, {
        ...logContext,
        weight: parsedWeight,
        reps: parsedReps,
      });
      onSaved();
    } finally {
      savingRef.current = false;
    }
  }, [
    editable,
    weight,
    reps,
    setId,
    logContext,
    initialWeight,
    initialReps,
    onSaved,
  ]);

  const handleBlur = () => {
    void persist();
  };

  const handleRowPress = useCallback(async () => {
    if (!editable) return;
    if (setId) {
      onOpenDetail(setId);
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const created = await createLoggedSet({
        ...logContext,
        weight: parseOptionalFloat(weight),
        reps: parseOptionalInt(reps),
      });
      onOpenDetail(created.id);
    } finally {
      savingRef.current = false;
    }
  }, [editable, setId, logContext, weight, reps, onOpenDetail]);

  const hasVideo =
    videoStatus === 'available' ||
    videoStatus === 'missing' ||
    videoStatus === 'permissionDenied';

  const row = (
    <View ref={rowRef} collapsable={false}>
      <Pressable
        onPress={() => void handleRowPress()}
        disabled={!editable}
        style={({ pressed }) => [styles.row, pressed && editable && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={
          setId
            ? `Set ${index}, ${initialWeight ?? '—'} by ${initialReps ?? '—'} reps. Open set details.`
            : `New set ${index}. Open set details.`
        }>
        <AppText variant="caption" muted style={styles.index}>
          {index}
        </AppText>
        <View style={styles.inputs}>
          <DenseInput
            ref={weightRef}
            value={weight}
            onChangeText={setWeight}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            placeholder="lb"
            editable={editable}
          />
          <AppText variant="dataLarge" muted style={styles.times}>
            ×
          </AppText>
          <DenseInput
            value={reps}
            onChangeText={setReps}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            placeholder="reps"
            editable={editable}
          />
        </View>
        {hasVideo ? <VideoBadge status={videoStatus} compact /> : null}
      </Pressable>
    </View>
  );

  if (!editable || !onDelete) return row;

  return (
    <SwipeToDeleteRow deletable onDelete={onDelete}>
      {row}
    </SwipeToDeleteRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.subtle,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.9,
  },
  index: {
    width: 18,
    textAlign: 'center',
  },
  inputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  times: {
    marginTop: 2,
  },
});
