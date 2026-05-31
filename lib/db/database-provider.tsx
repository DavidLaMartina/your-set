import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { seedDatabaseIfEmpty } from '@/features/seed/seed-database';
import { initDatabase } from '@/lib/db/client';
import { colors, spacing } from '@/lib/theme/tokens';

type DatabaseContextValue = {
  ready: boolean;
};

const DatabaseContext = createContext<DatabaseContextValue>({ ready: false });

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDatabase();
        await seedDatabaseIfEmpty();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Database failed to open');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <AppText variant="titleMedium" color={colors.accent.danger}>
          Database error
        </AppText>
        <AppText variant="body" muted>
          {error}
        </AppText>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent.primary} />
        <AppText variant="caption" muted>
          Loading…
        </AppText>
      </View>
    );
  }

  return <DatabaseContext.Provider value={{ ready }}>{children}</DatabaseContext.Provider>;
}

export function useDatabaseReady() {
  return useContext(DatabaseContext).ready;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
