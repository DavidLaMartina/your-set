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
import * as WorkoutRepo from '@/lib/db/repositories/workout-repository';
import { loadSessionView } from '@/features/workouts/services/session-view-service';
import { formatWorkoutElapsed } from '@/lib/format';
import { exercisesTabHref, variantHistoryHref } from '@/lib/navigation';
import { colors, spacing } from '@/lib/theme/tokens';
import type { ActiveWorkoutView } from '@/types/domain';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<ActiveWorkoutView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setSession(await loadSessionView(id));
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
    await WorkoutRepo.endWorkout(id);
    await refresh();
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

  return (
    <Screen>
      <StackHeader
        title={session.name ?? 'Session'}
        subtitle={isOpen ? formatWorkoutElapsed(session.startedAt) : 'Ended'}
      />

      <View style={styles.sessionMeta}>
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
        <PrimaryButton label="End session" variant="ghost" onPress={() => void handleEnd()} />
      ) : null}

      {session.blocks.length === 0 ? (
        <AppText variant="body" muted>
          No exercises in this session yet. Phase 3 will add logging here.
        </AppText>
      ) : null}

      {session.blocks.map((block) => (
        <Card
          key={block.id}
          title={block.variant.name}
          subtitle={block.exercise.name}
          onHeaderPress={() => router.push(variantHistoryHref(block.variant.id))}
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
            <PrimaryButton label="+ Set" variant="ghost" onPress={() => {}} />
          ) : null}
        </Card>
      ))}

      {isOpen ? (
        <>
          <PrimaryButton
            label="+ Exercise to session"
            variant="ghost"
            onPress={() => router.push(exercisesTabHref())}
          />
          <AppText variant="caption" muted>
            Phase 3: pick a variant and log sets into this session.
          </AppText>
        </>
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
