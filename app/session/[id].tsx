import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type View as ViewType } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { WorkoutSetRow, type WorkoutSetCommitFn } from '@/components/workout-set-row';
import { AppText } from '@/components/ui/app-text';
import { loadSessionInstanceView } from '@/features/sessions/services/session-instance-view-service';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import { formatExerciseDisplayName, formatSetLabel, formatWorkoutElapsed } from '@/lib/format';
import {
  deleteWorkout,
  getWorkoutDeleteSummary,
} from '@/features/sessions/services/workouts-tab-service';
import { deleteWorkoutSet } from '@/features/sets/services/set-log-service';
import { confirmDestructive } from '@/lib/confirm-delete';
import { setDeleteNeedsConfirmation } from '@/lib/set-delete';
import {
  editSetHref,
  exerciseDetailHref,
  exercisePickerHref,
  sessionDefinitionHref,
} from '@/lib/navigation';
import { scrollIntoViewAboveKeyboard } from '@/lib/scroll-into-view';
import { colors, spacing } from '@/lib/theme/tokens';
import { isWorkoutEditable, type SessionExerciseBlock, type SessionInstanceView } from '@/types/domain';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionInstanceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftBlockId, setDraftBlockId] = useState<string | null>(null);
  const [draftNonce, setDraftNonce] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const commitActiveSetRef = useRef<WorkoutSetCommitFn | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setSession(await loadSessionInstanceView(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleEnd = async () => {
    if (!id) return;
    await SessionInstanceRepo.endSessionInstance(id);
    setDraftBlockId(null);
    await refresh();
  };

  const handleUnlock = async () => {
    if (!id) return;
    await SessionInstanceRepo.unlockSessionInstanceForEditing(id);
    await refresh();
  };

  const handleLock = async () => {
    if (!id) return;
    await SessionInstanceRepo.lockSessionInstanceEditing(id);
    setDraftBlockId(null);
    await refresh();
  };

  const handleDelete = () => {
    if (!id) return;
    void (async () => {
      const summary = await getWorkoutDeleteSummary(id);
      if (!summary) return;

      const label = summary.sessionName ?? 'this workout';
      const setNote =
        summary.setCount > 0
          ? `${summary.setCount} set${summary.setCount === 1 ? '' : 's'} stay in your log, unlinked. `
          : '';

      confirmDestructive({
        title: 'Delete workout?',
        message: `${setNote}${label} visit is removed permanently.`,
        onConfirm: async () => {
          await deleteWorkout(id);
          router.back();
        },
      });
    })();
  };

  useEffect(() => {
    if (!draftBlockId) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [draftBlockId, draftNonce]);

  const handleRegisterCommit = useCallback((commit: WorkoutSetCommitFn | null) => {
    commitActiveSetRef.current = commit;
  }, []);

  const handleAddSet = useCallback(async (blockId: string) => {
    const commit = commitActiveSetRef.current;
    if (commit) {
      const result = await commit();
      // Partial entry: keep the row and the user's cursor; don't open a new one.
      if (result === 'incomplete') return;
      commitActiveSetRef.current = null;
    }
    setDraftBlockId(blockId);
    setDraftNonce((n) => n + 1);
  }, []);

  const handleInputFocus = useCallback((rowRef: RefObject<ViewType | null>) => {
    scrollIntoViewAboveKeyboard(scrollRef, rowRef, () => scrollYRef.current);
  }, []);

  const handleOpenSetDetail = useCallback((setId: string) => {
    setDraftBlockId(null);
    router.push(editSetHref(setId, { returnTo: 'workout' }));
  }, []);

  const handleSetSaved = async () => {
    setDraftBlockId(null);
    await refresh();
  };

  const handleDeleteSet = (setId: string, block: SessionExerciseBlock) => {
    if (!id) return;
    const set = block.sets.find((s) => s.id === setId);
    if (!set) return;

    const remove = async () => {
      await deleteWorkoutSet(setId, id);
      await refresh();
    };

    if (setDeleteNeedsConfirmation(set)) {
      confirmDestructive({
        title: `Delete ${formatSetLabel(set.weight, set.reps)}?`,
        message: 'This set has notes or a video attached.',
        onConfirm: remove,
      });
      return;
    }

    void remove();
  };

  if (!id) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Missing session id.</AppText>
      </Screen>
    );
  }

  if (loading && !session) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Session" />
        <AppText muted>Session not found.</AppText>
      </Screen>
    );
  }

  const isOpen = session.endedAt == null;
  const editable = isWorkoutEditable(session);
  const title = session.sessionName ?? 'Ad-hoc workout';

  return (
    <Screen
      ref={scrollRef}
      keyboardShouldPersistTaps="always"
      onScroll={(e) => {
        scrollYRef.current = e.nativeEvent.contentOffset.y;
      }}>
      <StackHeader
        title={title}
        subtitle={isOpen ? formatWorkoutElapsed(session.startedAt) : 'Ended'}
      />

      <View style={styles.sessionMeta}>
        {session.sessionId ? (
          <PrimaryButton
            label="View session definition"
            variant="ghost"
            onPress={() => router.push(sessionDefinitionHref(session.sessionId!))}
          />
        ) : null}
        {session.bodyweight != null ? (
          <AppText variant="caption" muted>
            Bodyweight {session.bodyweight} lb
          </AppText>
        ) : null}
        {session.endedAt ? (
          <AppText variant="caption" muted>
            Ended {new Date(session.endedAt).toLocaleString()}
          </AppText>
        ) : null}
      </View>

      {isOpen ? (
        <PrimaryButton label="End workout" variant="ghost" onPress={() => void handleEnd()} />
      ) : editable ? (
        <PrimaryButton label="Lock workout" variant="ghost" onPress={() => void handleLock()} />
      ) : (
        <PrimaryButton
          label="Edit workout"
          variant="ghost"
          onPress={() => void handleUnlock()}
        />
      )}
      <PrimaryButton label="Delete workout" variant="ghost" onPress={handleDelete} />

      {session.blocks.length === 0 ? (
        <AppText variant="body" muted>
          No exercises in this workout yet. Add one below.
        </AppText>
      ) : null}

      {session.blocks.map((block) => {
        const displayTitle = formatExerciseDisplayName(
          block.exercise.name,
          block.manufacturerName,
        );
        const showManufacturerCaption =
          block.manufacturerName != null &&
          !/\bmachine\b/i.test(block.exercise.name);

        return (
          <Card
            key={block.id}
            title={displayTitle}
            onHeaderPress={() => router.push(exerciseDetailHref(block.exerciseId))}
            headerRight={
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            }>
            {showManufacturerCaption ? (
              <AppText variant="caption" muted>
                {block.manufacturerName}
              </AppText>
            ) : null}
            {block.notes ? (
              <AppText variant="caption" muted>
                {block.notes}
              </AppText>
            ) : null}
            <View style={styles.setList}>
              {block.sets.map((set, i) => (
                <WorkoutSetRow
                  key={set.id}
                  index={i + 1}
                  setId={set.id}
                  initialWeight={set.weight}
                  initialReps={set.reps}
                  videoStatus={set.video?.availabilityStatus ?? 'none'}
                  editable={editable}
                  logContext={{
                    exerciseId: block.exerciseId,
                    sessionInstanceId: id,
                    sessionInstanceExerciseId: block.id,
                  }}
                  onInputFocus={handleInputFocus}
                  onRegisterCommit={handleRegisterCommit}
                  onSaved={handleSetSaved}
                  onOpenDetail={handleOpenSetDetail}
                  onDelete={
                    editable
                      ? () => handleDeleteSet(set.id, block)
                      : undefined
                  }
                />
              ))}
              {draftBlockId === block.id ? (
                <WorkoutSetRow
                  key={`draft-${draftNonce}`}
                  index={block.sets.length + 1}
                  setId={null}
                  initialWeight={null}
                  initialReps={null}
                  videoStatus="none"
                  editable={editable}
                  focusWeight
                  onInputFocus={handleInputFocus}
                  onRegisterCommit={handleRegisterCommit}
                  logContext={{
                    exerciseId: block.exerciseId,
                    sessionInstanceId: id,
                    sessionInstanceExerciseId: block.id,
                  }}
                  onSaved={handleSetSaved}
                  onOpenDetail={handleOpenSetDetail}
                  onDelete={
                    editable ? () => setDraftBlockId(null) : undefined
                  }
                />
              ) : null}
            </View>
            {editable ? (
              <Pressable
                onPress={() => void handleAddSet(block.id)}
                style={styles.addSet}
                accessibilityRole="button"
                accessibilityLabel="Add set">
                <Ionicons name="add-circle-outline" size={28} color={colors.accent.primary} />
              </Pressable>
            ) : null}
          </Card>
        );
      })}

      {editable ? (
        <PrimaryButton
          label="+ Exercise to workout"
          variant="ghost"
          onPress={() => router.push(exercisePickerHref('workout', id))}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sessionMeta: {
    gap: 4,
  },
  setList: {
    gap: spacing.xs,
  },
  addSet: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
