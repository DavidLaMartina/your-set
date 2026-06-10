import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SetListCard } from '@/components/set-list-card';
import { AppText } from '@/components/ui/app-text';
import { listRecentSets, type RecentSetRow } from '@/features/sets/services/recent-sets-service';
import { exercisePickerForLogSetHref } from '@/lib/navigation';

export default function SetsScreen() {
  const [rows, setRows] = useState<RecentSetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listRecentSets());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleLarge">Sets</AppText>
        <AppText variant="caption" muted>
          Recent logs — newest first. Log a set anytime without a workout.
        </AppText>
      </View>

      <PrimaryButton
        label="+ Log set"
        onPress={() => router.push(exercisePickerForLogSetHref())}
      />

      {loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          Loading…
        </AppText>
      ) : null}

      {!loading && rows.length === 0 ? (
        <AppText variant="body" muted>
          No sets logged yet. Tap + Log set to record one.
        </AppText>
      ) : null}

      {rows.map((row) => (
        <SetListCard key={row.id} row={row} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
});
