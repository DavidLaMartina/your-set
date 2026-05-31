import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/ui/app-text';
import {
  listSessions,
  startNewSession,
  type SessionListItem,
} from '@/features/workouts/services/sessions-list-service';
import { formatDate } from '@/lib/format';
import { sessionDetailHref } from '@/lib/navigation';
import { colors } from '@/lib/theme/tokens';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await listSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleStartSession = async () => {
    const workout = await startNewSession();
    router.push(sessionDetailHref(workout.id));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Sessions</AppText>
        <AppText variant="caption" muted>
          Training visits — open and past
        </AppText>
      </View>

      <PrimaryButton label="Start session" onPress={() => void handleStartSession()} />

      {loading && sessions.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && sessions.length === 0 ? (
        <AppText variant="body" muted>
          No sessions yet. Start one or log sets without a session from Exercises.
        </AppText>
      ) : null}

      {sessions.map(({ workout, setCount, variantCount }) => {
        const isOpen = workout.endedAt == null;
        return (
          <Card
            key={workout.id}
            title={workout.name ?? 'Session'}
            subtitle={formatDate(workout.startedAt)}
            onPress={() => router.push(sessionDetailHref(workout.id))}
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
              {workout.bodyweight != null ? ` · ${workout.bodyweight} lb` : ''}
            </AppText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
});
