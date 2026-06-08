import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { MissingVideo } from '@/components/missing-video';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetTypeBadge } from '@/components/set-type-badge';
import { SetVideoPlayer } from '@/components/set-video-player';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { loadSetWithContext } from '@/features/history/services/exercise-history-service';
import {
  attachVideoToSet,
  removeVideoFromSet,
  resolveAndPersistSetVideo,
} from '@/features/video/services/set-video-service';
import { logSetHref, setCompareHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';
import type { HistorySetRow, SetVideo } from '@/types/domain';
import { SET_TYPE_LABELS } from '@/types/domain';

export default function SetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [set, setSet] = useState<HistorySetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const applyVideo = useCallback((video: SetVideo | null) => {
    setSet((prev) => (prev ? { ...prev, video } : prev));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const row = await loadSetWithContext(id);
      if (cancelled) return;
      setSet(row);
      setLoading(false);
      if (row?.video) {
        const refreshed = await resolveAndPersistSetVideo(id);
        if (!cancelled) applyVideo(refreshed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, applyVideo]);

  const handleAttach = useCallback(async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      const result = await attachVideoToSet(id);
      if (result.ok) {
        applyVideo(result.video);
      } else if (result.reason === 'permissionDenied') {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access in Settings to attach a video.',
        );
      }
    } finally {
      setBusy(false);
    }
  }, [id, busy, applyVideo]);

  const handleRemove = useCallback(() => {
    if (!id || busy) return;
    Alert.alert('Remove video reference?', 'This removes the link only; your video stays in Photos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeVideoFromSet(id);
            applyVideo(null);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }, [id, busy, applyVideo]);

  if (loading) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!set) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Set" />
        <AppText muted>
          Set not found in the database. Reload the app if you still see this after a schema update.
        </AppText>
      </Screen>
    );
  }

  const video = set.video;
  const status = video?.availabilityStatus ?? 'none';
  const canPlay = status === 'available' && !!video?.uri;
  const isMissing = status === 'missing' || status === 'permissionDenied';

  return (
    <Screen>
      <StackHeader title="Set detail" />
      <View style={styles.stats}>
        <AppText variant="titleLarge">{formatSetLabel(set.weight, set.reps)}</AppText>
        {set.setType !== 'straight' ? <SetTypeBadge setType={set.setType} /> : null}
      </View>

      <Metadata label="Performed" value={formatPerformedAt(set.performedAt)} />
      <Metadata
        label="Session"
        value={
          set.sessionInstanceId ? set.sessionName ?? 'In session' : 'None (set-only log)'
        }
      />
      <Metadata label="Set type" value={SET_TYPE_LABELS[set.setType]} />
      {set.manufacturerName ? (
        <Metadata label="Manufacturer" value={set.manufacturerName} />
      ) : null}
      {set.rir != null ? <Metadata label="RIR" value={String(set.rir)} /> : null}
      {set.notes ? <Metadata label="Notes" value={set.notes} /> : null}

      <AppText variant="titleMedium">Video</AppText>
      {canPlay ? (
        <>
          <SetVideoPlayer uri={video!.uri!} />
          <PrimaryButton
            label={busy ? 'Working…' : 'Replace video'}
            variant="ghost"
            onPress={handleAttach}
          />
          <PrimaryButton label="Remove video reference" variant="danger" onPress={handleRemove} />
        </>
      ) : isMissing ? (
        <MissingVideo onRelink={handleAttach} onRemove={handleRemove} />
      ) : (
        <>
          <VideoPlaceholder status="none" onPress={handleAttach} />
          <PrimaryButton
            label={busy ? 'Opening…' : 'Attach video'}
            onPress={handleAttach}
          />
        </>
      )}

      <PrimaryButton
        label="Edit set"
        variant="ghost"
        onPress={() =>
          router.push(
            logSetHref({
              exerciseId: set.exerciseId,
              sessionInstanceId: set.sessionInstanceId ?? undefined,
              sessionInstanceExerciseId: set.sessionInstanceExerciseId ?? undefined,
              setId: set.id,
            }),
          )
        }
      />

      <PrimaryButton
        label="Compare with prior set"
        onPress={() => router.push(setCompareHref(set.id))}
      />
    </Screen>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaRow: {
    gap: 2,
  },
});
