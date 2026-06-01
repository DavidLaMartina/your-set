import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SwipeToArchiveRow } from '@/components/swipe-to-archive-row';
import { SwipeToDeleteRow } from '@/components/swipe-to-delete-row';
import { AppText } from '@/components/ui/app-text';
import {
  createSessionDefinition,
  deleteSessionDefinition,
  getSessionDefinitionDeleteSummary,
  loadSessionDefinitionsTab,
  reactivateSessionDefinition,
  retireSessionDefinition,
  type SessionDefinitionsTabData,
} from '@/features/sessions/services/session-definitions-service';
import { confirmArchiveSession, confirmDeleteArchivedSession } from '@/lib/confirm-delete';
import { sessionDefinitionHref } from '@/lib/navigation';
import type { Session } from '@/types/domain';

export default function SessionsScreen() {
  const [data, setData] = useState<SessionDefinitionsTabData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadSessionDefinitionsTab());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleAddDefinition = () => {
    Alert.prompt(
      'New session',
      'Name this rotation slot (e.g. Push A)',
      async (name) => {
        if (!name?.trim()) return;
        const session = await createSessionDefinition(name.trim());
        router.push(sessionDefinitionHref(session.id));
        await refresh();
      },
    );
  };

  const handleArchiveDefinition = (session: Session) => {
    confirmArchiveSession(session.name, async () => {
      await retireSessionDefinition(session.id);
      await refresh();
    });
  };

  const handleDeleteArchivedDefinition = (sessionId: string) => {
    void (async () => {
      const summary = await getSessionDefinitionDeleteSummary(sessionId);
      if (!summary) return;

      confirmDeleteArchivedSession(summary.name, summary.instanceCount, async () => {
        await deleteSessionDefinition(sessionId);
        await refresh();
      });
    })();
  };

  const active = data?.active ?? [];
  const retired = data?.retired ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Sessions</AppText>
        <AppText variant="caption" muted>
          Edit rotation definitions — start workouts from the Workouts tab
        </AppText>
      </View>

      <PrimaryButton label="+ Session" variant="ghost" onPress={handleAddDefinition} />

      <Section title="Active">
        {loading && active.length === 0 ? (
          <AppText variant="body" muted>
            Loading…
          </AppText>
        ) : null}
        {!loading && active.length === 0 ? (
          <AppText variant="body" muted>
            No active sessions. Add one for your rotation (e.g. Push A).
          </AppText>
        ) : null}
        {active.map((session) => (
          <ActiveDefinitionRow
            key={session.id}
            session={session}
            onPress={() => router.push(sessionDefinitionHref(session.id))}
            onArchive={() => handleArchiveDefinition(session)}
          />
        ))}
      </Section>

      {retired.length > 0 ? (
        <Section
          title="Archived"
          hint="Swipe left on an archived session to delete it. Past workouts become ad-hoc; your logged sets are kept.">
          {retired.map((session) => (
            <SwipeToDeleteRow
              key={session.id}
              onDelete={() => handleDeleteArchivedDefinition(session.id)}>
              <Card
                title={session.name}
                subtitle="Archived"
                onPress={() => router.push(sessionDefinitionHref(session.id))}>
                <PrimaryButton
                  label="Restore to rotation"
                  variant="ghost"
                  onPress={() =>
                    void reactivateSessionDefinition(session.id).then(() => refresh())
                  }
                />
              </Card>
            </SwipeToDeleteRow>
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="titleMedium">{title}</AppText>
      {hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

function ActiveDefinitionRow({
  session,
  onPress,
  onArchive,
}: {
  session: Session;
  onPress: () => void;
  onArchive: () => void;
}) {
  return (
    <SwipeToArchiveRow onArchive={onArchive}>
      <Card title={session.name} subtitle="Active in rotation" onPress={onPress}>
        <AppText variant="caption" muted>
          Tap to edit · swipe left to archive
        </AppText>
      </Card>
    </SwipeToArchiveRow>
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
