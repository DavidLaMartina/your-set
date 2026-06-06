import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetRow } from '@/components/set-row';
import { AppText } from '@/components/ui/app-text';
import { loadSessionInstanceView } from '@/features/sessions/services/session-instance-view-service';
import * as SessionInstanceRepo from '@/lib/db/repositories/session-instance-repository';
import { formatWorkoutElapsed } from '@/lib/format';
import {
  deleteWorkout,
  getWorkoutDeleteSummary,
} from '@/features/sessions/services/workouts-tab-service';
import { confirmDestructive } from '@/lib/confirm-delete';
import { exerciseDetailHref, exercisePickerHref, logSetHref, sessionDefinitionHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';
import type { SessionInstanceView } from '@/types/domain';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionInstanceView | null>(null);
  const [loading, setLoading] = useState(true);

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
  const title = session.sessionName ?? 'Ad-hoc workout';

  return (
    <Screen>
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
      ) : null}
      <PrimaryButton label="Delete workout" variant="ghost" onPress={handleDelete} />

      {session.blocks.length === 0 ? (
        <AppText variant="body" muted>
          No exercises in this workout yet. Add one below.
        </AppText>
      ) : null}

      {session.blocks.map((block) => (
        <Card
          key={block.id}
          title={block.exercise.name}
          onHeaderPress={() => router.push(exerciseDetailHref(block.exerciseId))}
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
          {isOpen ? (
            <PrimaryButton
              label="+ Set"
              variant="ghost"
              onPress={() =>
                router.push(
                  logSetHref({
                    exerciseId: block.exerciseId,
                    sessionInstanceId: id,
                    sessionInstanceExerciseId: block.id,
                  }),
                )
              }
            />
          ) : null}
        </Card>
      ))}

      {isOpen ? (
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
});
