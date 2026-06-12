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

/**
 * Result of asking a row to commit:
 * - `saved`: weight×reps were complete and persisted (or updated)
 * - `noop`: nothing to save (empty row, or unchanged existing set)
 * - `incomplete`: partial data typed but not yet a full set — caller should
 *   leave the row alone (do NOT discard what the user is mid-typing)
 */
export type CommitResult = 'saved' | 'noop' | 'incomplete';

/** Save weight×reps when both are entered; safe to call while a field is focused. */
export type WorkoutSetCommitFn = () => Promise<CommitResult>;

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
  /** Registers the row's commit fn while a field is focused. */
  onRegisterCommit?: (commit: WorkoutSetCommitFn | null) => void;
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
  onRegisterCommit,
  onSaved,
  onOpenDetail,
  onDelete,
}: Props) {
  const [weight, setWeight] = useState(() => valuesFromSet(initialWeight, initialReps).weight);
  const [reps, setReps] = useState(() => valuesFromSet(initialWeight, initialReps).reps);
  const savingRef = useRef(false);
  const rowRef = useRef<ViewType>(null);
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const weightFocusedRef = useRef(false);
  const repsFocusedRef = useRef(false);
  const blurPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror the latest typed values so the commit fn registered with the parent
  // (at focus time) never reads stale closure values when `+` calls it.
  const weightValueRef = useRef(weight);
  const repsValueRef = useRef(reps);
  weightValueRef.current = weight;
  repsValueRef.current = reps;

  const clearBlurPersistTimer = () => {
    if (blurPersistTimerRef.current != null) {
      clearTimeout(blurPersistTimerRef.current);
      blurPersistTimerRef.current = null;
    }
  };

  useEffect(() => () => clearBlurPersistTimer(), []);

  const handleInputFocus = () => {
    onInputFocus?.(rowRef);
  };

  const persist = useCallback(async () => {
    if (!editable || savingRef.current) return;
    const parsedWeight = parseOptionalFloat(weightValueRef.current);
    const parsedReps = parseOptionalInt(repsValueRef.current);
    if (parsedWeight == null || parsedReps == null) return;

    if (!setId) {
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
  }, [editable, setId, logContext, initialWeight, initialReps, onSaved]);

  // Stable across renders: reads the latest values from refs, so the parent can
  // safely hold onto this reference and call it from the `+` button.
  const commitIfReady = useCallback<WorkoutSetCommitFn>(async () => {
    const currentWeight = weightValueRef.current;
    const currentReps = repsValueRef.current;
    const parsedWeight = parseOptionalFloat(currentWeight);
    const parsedReps = parseOptionalInt(currentReps);
    const ready = parsedWeight != null && parsedReps != null;

    if (!ready) {
      const hasPartial =
        !setId && (currentWeight.trim() !== '' || currentReps.trim() !== '');
      return hasPartial ? 'incomplete' : 'noop';
    }
    if (setId && parsedWeight === initialWeight && parsedReps === initialReps) {
      return 'noop';
    }

    weightFocusedRef.current = false;
    repsFocusedRef.current = false;
    clearBlurPersistTimer();
    onRegisterCommit?.(null);
    await persist();
    return 'saved';
  }, [setId, initialWeight, initialReps, persist, onRegisterCommit]);

  const schedulePersistAfterBlur = useCallback(() => {
    clearBlurPersistTimer();
    blurPersistTimerRef.current = setTimeout(() => {
      blurPersistTimerRef.current = null;
      if (weightFocusedRef.current || repsFocusedRef.current) return;
      onRegisterCommit?.(null);
      void persist();
    }, 0);
  }, [persist, onRegisterCommit]);

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

  useEffect(
    () => () => {
      onRegisterCommit?.(null);
    },
    [onRegisterCommit],
  );

  const handleWeightFocus = () => {
    clearBlurPersistTimer();
    weightFocusedRef.current = true;
    onRegisterCommit?.(commitIfReady);
    handleInputFocus();
  };

  const handleWeightBlur = () => {
    weightFocusedRef.current = false;
    schedulePersistAfterBlur();
  };

  const handleRepsFocus = () => {
    clearBlurPersistTimer();
    repsFocusedRef.current = true;
    onRegisterCommit?.(commitIfReady);
    handleInputFocus();
  };

  const handleRepsBlur = () => {
    repsFocusedRef.current = false;
    schedulePersistAfterBlur();
  };

  const handleWeightSubmit = () => {
    repsRef.current?.focus();
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
            onFocus={handleWeightFocus}
            onBlur={handleWeightBlur}
            onSubmitEditing={handleWeightSubmit}
            placeholder="lb"
            editable={editable}
          />
          <AppText variant="dataLarge" muted style={styles.times}>
            ×
          </AppText>
          <DenseInput
            ref={repsRef}
            value={reps}
            onChangeText={setReps}
            onFocus={handleRepsFocus}
            onBlur={handleRepsBlur}
            onSubmitEditing={schedulePersistAfterBlur}
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
