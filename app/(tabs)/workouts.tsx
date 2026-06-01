import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SwipeToDeleteRow } from '@/components/swipe-to-delete-row';
import { AppText } from '@/components/ui/app-text';
import {
  deleteWorkout,
  getWorkoutDeleteSummary,
  loadWorkoutsTab,
  startAdHocWorkout,
  startSessionFromDefinition,
  type WorkoutListItem,
  type WorkoutsTabData,
} from '@/features/sessions/services/workouts-tab-service';
import { confirmDestructive } from '@/lib/confirm-delete';
import { formatDate } from '@/lib/format';
import { sessionDetailHref } from '@/lib/navigation';
import { colors } from '@/lib/theme/tokens';
import type { Session } from '@/types/domain';

export default function WorkoutsScreen() {
  const [data, setData] = useState<WorkoutsTabData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadWorkoutsTab());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleStartFromDefinition = async (sessionId: string) => {
    const instance = await startSessionFromDefinition(sessionId);
    router.push(sessionDetailHref(instance.id));
  };

  const handleStartAdHoc = async () => {
    const instance = await startAdHocWorkout();
    router.push(sessionDetailHref(instance.id));
  };

  const handleDeleteWorkout = (instanceId: string) => {
    void (async () => {
      const summary = await getWorkoutDeleteSummary(instanceId);
      if (!summary) return;

      const label = summary.sessionName ?? 'Ad-hoc workout';
      const setNote =
        summary.setCount > 0
          ? `${summary.setCount} set${summary.setCount === 1 ? '' : 's'} will remain in your log (unlinked from this visit). `
          : '';

      confirmDestructive({
        title: `Delete ${label} visit?`,
        message: `${setNote}This cannot be undone.`,
        onConfirm: async () => {
          await deleteWorkout(instanceId);
          await refresh();
        },
      });
    })();
  };

  const openWorkouts = data?.openWorkouts ?? [];
  const rotation = data?.rotation ?? [];
  const recentWorkouts = data?.recentWorkouts ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Workouts</AppText>
        <AppText variant="caption" muted>
          Start visits, log sets, track open workouts
        </AppText>
      </View>

      <PrimaryButton label="Ad-hoc workout" onPress={() => void handleStartAdHoc()} />

      <Section title="Open now">
        {loading && openWorkouts.length === 0 ? (
          <AppText variant="body" muted>
            Loading…
          </AppText>
        ) : null}
        {!loading && openWorkouts.length === 0 ? (
          <AppText variant="body" muted>
            No open workouts. Start one below.
          </AppText>
        ) : null}
        {openWorkouts.map((item) => (
          <WorkoutRow key={item.instance.id} item={item} onDelete={handleDeleteWorkout} />
        ))}
      </Section>

      <Section title="Start from session">
        {rotation.length === 0 ? (
          <AppText variant="body" muted>
            No active sessions. Add one under the Sessions tab.
          </AppText>
        ) : null}
        {rotation.map((session) => (
          <StartCard
            key={session.id}
            session={session}
            onStart={() => void handleStartFromDefinition(session.id)}
          />
        ))}
      </Section>

      <Section title="Recent">
        {!loading && recentWorkouts.length === 0 ? (
          <AppText variant="body" muted>
            No completed workouts yet.
          </AppText>
        ) : null}
        {recentWorkouts.map((item) => (
          <WorkoutRow key={item.instance.id} item={item} onDelete={handleDeleteWorkout} />
        ))}
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="titleMedium">{title}</AppText>
      {children}
    </View>
  );
}

function StartCard({ session, onStart }: { session: Session; onStart: () => void }) {
  return (
    <Card title={session.name} subtitle="Session definition">
      <PrimaryButton label="Start workout" onPress={onStart} />
    </Card>
  );
}

function WorkoutRow({
  item,
  onDelete,
}: {
  item: WorkoutListItem;
  onDelete: (instanceId: string) => void;
}) {
  const { instance, sessionName, setCount, variantCount } = item;
  const isOpen = instance.endedAt == null;
  const title = sessionName ?? 'Ad-hoc workout';

  return (
    <SwipeToDeleteRow onDelete={() => onDelete(instance.id)}>
      <Card
        title={title}
        subtitle={formatDate(instance.startedAt)}
        onPress={() => router.push(sessionDetailHref(instance.id))}
        headerRight={
          isOpen ? (
            <AppText variant="caption" color={colors.accent.primary}>
              Open
            </AppText>
          ) : (
            <AppText variant="caption" muted>
              Ended
            </AppText>
          )
        }>
        <AppText variant="caption" muted>
          {setCount} set{setCount === 1 ? '' : 's'}
          {variantCount > 0
            ? ` · ${variantCount} variant${variantCount === 1 ? '' : 's'}`
            : ''}
          {instance.bodyweight != null ? ` · ${instance.bodyweight} lb` : ''}
        </AppText>
      </Card>
    </SwipeToDeleteRow>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  section: {
    gap: 8,
  },
});
