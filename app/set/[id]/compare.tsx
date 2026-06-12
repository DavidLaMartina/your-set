import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { SetVideoThumbnail } from '@/components/set-video-thumbnail';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import {
  loadCompareData,
  type CompareCandidate,
  type CompareData,
  type CompareSet,
} from '@/features/history/services/compare-service';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { COMPARE_SCOPES, type CompareScope } from '@/types/domain';

const SCOPE_LABELS: Record<CompareScope, string> = {
  exercise: 'This exercise',
  muscle: 'Same muscle',
  all: 'All',
};

/** In-memory, non-destructive trim window. `end: null` means play to the natural end. */
type TrimWindow = { start: number; end: number | null };
const FULL_WINDOW: TrimWindow = { start: 0, end: null };

function playableUri(set: CompareSet | null): string | null {
  if (!set?.video) return null;
  return set.video.availabilityStatus === 'available' ? set.video.uri ?? null : null;
}

/** Orientation from stored (display-corrected) dimensions; defaults to portrait. */
function isLandscape(set: CompareSet | null): boolean {
  const v = set?.video;
  return !!v && !!v.width && !!v.height && v.width > v.height;
}

export default function VideoCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scope, setScope] = useState<CompareScope>('exercise');
  const [data, setData] = useState<CompareData | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leftPlaying, setLeftPlaying] = useState(false);
  const [rightPlaying, setRightPlaying] = useState(false);
  const [leftWindow, setLeftWindow] = useState<TrimWindow>(FULL_WINDOW);
  const [rightWindow, setRightWindow] = useState<TrimWindow>(FULL_WINDOW);

  // Both players are owned here so a single control can drive them in lockstep.
  const leftPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.2;
  });
  const rightPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.2;
  });

  // True only for the brief window around a sync action, so the playingChange
  // handler can tell "play both" apart from a tap on a video's own controls.
  const syncMutedRef = useRef(false);
  // True while a synced playback is running, gating trim-end enforcement.
  const syncActiveRef = useRef(false);
  const leftWindowRef = useRef(leftWindow);
  const rightWindowRef = useRef(rightWindow);
  leftWindowRef.current = leftWindow;
  rightWindowRef.current = rightWindow;

  const target = useMemo(
    () => data?.candidates.find((c) => c.id === targetId) ?? null,
    [data, targetId],
  );

  const sourceUri = playableUri(data?.source ?? null);
  const targetUri = playableUri(target);

  useEffect(() => {
    leftPlayer.replace(sourceUri ? { uri: sourceUri } : null);
    setLeftWindow(FULL_WINDOW);
  }, [leftPlayer, sourceUri]);

  useEffect(() => {
    rightPlayer.replace(targetUri ? { uri: targetUri } : null);
    setRightWindow(FULL_WINDOW);
  }, [rightPlayer, targetUri]);

  // Track play state + restore audio when a clip is played from its own controls.
  useEffect(() => {
    const bind = (player: VideoPlayer, setPlaying: (v: boolean) => void) =>
      player.addListener('playingChange', ({ isPlaying }) => {
        setPlaying(isPlaying);
        if (isPlaying && !syncMutedRef.current) {
          player.muted = false; // played individually → audio on
          syncActiveRef.current = false;
        }
      });
    const subs = [bind(leftPlayer, setLeftPlaying), bind(rightPlayer, setRightPlaying)];
    return () => subs.forEach((s) => s.remove());
  }, [leftPlayer, rightPlayer]);

  // Enforce the trim end during synced playback only.
  useEffect(() => {
    const bind = (player: VideoPlayer, windowRef: { current: TrimWindow }) =>
      player.addListener('timeUpdate', ({ currentTime }) => {
        const end = windowRef.current.end;
        if (syncActiveRef.current && end != null && currentTime >= end) player.pause();
      });
    const subs = [bind(leftPlayer, leftWindowRef), bind(rightPlayer, rightWindowRef)];
    return () => subs.forEach((s) => s.remove());
  }, [leftPlayer, rightPlayer]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await loadCompareData(id, scope);
      if (cancelled) return;
      setData(result);
      setTargetId(result?.defaultTargetId ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, scope]);

  const syncPlay = useCallback(
    (fromStart: boolean) => {
      syncMutedRef.current = true;
      syncActiveRef.current = true;
      const start = (player: VideoPlayer, uri: string | null, win: TrimWindow) => {
        if (!uri) return;
        player.muted = true;
        if (fromStart) player.currentTime = win.start;
        player.play();
      };
      start(leftPlayer, sourceUri, leftWindow);
      start(rightPlayer, targetUri, rightWindow);
      // Release after the resulting playingChange events have fired so later
      // individual taps are recognised and unmuted.
      setTimeout(() => {
        syncMutedRef.current = false;
      }, 500);
    },
    [leftPlayer, rightPlayer, sourceUri, targetUri, leftWindow, rightWindow],
  );

  const pauseBoth = useCallback(() => {
    syncActiveRef.current = false;
    leftPlayer.pause();
    rightPlayer.pause();
  }, [leftPlayer, rightPlayer]);

  const availableScopes = COMPARE_SCOPES.filter(
    (s) => s !== 'muscle' || data?.primaryMuscleId != null,
  );
  const canPlayAny = !!sourceUri || !!targetUri;
  const anyPlaying = leftPlaying || rightPlaying;
  const stacked = isLandscape(data?.source ?? null) && isLandscape(target) && !!sourceUri && !!targetUri;

  if (loading && !data) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Compare" />
        <AppText muted>Loading…</AppText>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen scroll={false} padded>
        <StackHeader title="Compare" />
        <AppText muted>Set not found.</AppText>
      </Screen>
    );
  }

  const maxHeightFraction = stacked ? 0.32 : 0.4;

  return (
    <Screen>
      <StackHeader title="Compare" subtitle="Side-by-side" />

      <View style={stacked ? styles.panesColumn : styles.panesRow}>
        <ComparePane
          label="Selected"
          set={data.source}
          player={leftPlayer}
          stacked={stacked}
          maxHeightFraction={maxHeightFraction}
        />
        {target ? (
          <ComparePane
            label="Compared"
            set={target}
            player={rightPlayer}
            stacked={stacked}
            maxHeightFraction={maxHeightFraction}
          />
        ) : (
          <View style={[styles.pane, stacked ? styles.paneColumn : styles.paneRow, styles.emptyPane]}>
            <AppText variant="caption" muted style={styles.center}>
              {loading ? 'Loading…' : 'No video set to compare in this scope'}
            </AppText>
          </View>
        )}
      </View>

      {canPlayAny ? (
        <>
          <View style={styles.controls}>
            <PrimaryButton label="▶ Play both" onPress={() => syncPlay(true)} />
            {anyPlaying ? (
              <PrimaryButton label="Pause" variant="ghost" onPress={pauseBoth} />
            ) : (
              <PrimaryButton label="Resume" variant="ghost" onPress={() => syncPlay(false)} />
            )}
          </View>
          <AppText variant="caption" muted>
            Play both mutes audio and starts at each clip’s trim point. Use a clip’s own controls to
            play it with sound.
          </AppText>

          {sourceUri ? (
            <TrimRow
              label="Selected"
              window={leftWindow}
              player={leftPlayer}
              onChange={setLeftWindow}
            />
          ) : null}
          {targetUri ? (
            <TrimRow
              label="Compared"
              window={rightWindow}
              player={rightPlayer}
              onChange={setRightWindow}
            />
          ) : null}
        </>
      ) : null}

      <View style={styles.scopeRow}>
        {availableScopes.map((s) => {
          const selected = s === scope;
          const label =
            s === 'muscle' && data.primaryMuscleName ? data.primaryMuscleName : SCOPE_LABELS[s];
          return (
            <Pressable
              key={s}
              onPress={() => setScope(s)}
              style={[styles.chip, selected && styles.chipOn]}>
              <AppText
                variant="caption"
                color={selected ? colors.text.inverse : colors.text.secondary}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="caption" muted>
        {data.candidates.length === 0
          ? 'No videos to compare against in this scope.'
          : `${data.candidates.length} video ${
              data.candidates.length === 1 ? 'set' : 'sets'
            } · tap to compare`}
      </AppText>

      {data.candidates.map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          selected={candidate.id === targetId}
          showExercise={scope !== 'exercise'}
          onPress={() => setTargetId(candidate.id)}
        />
      ))}

      <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function ComparePane({
  label,
  set,
  player,
  stacked,
  maxHeightFraction,
}: {
  label: string;
  set: CompareSet;
  player: VideoPlayer;
  stacked: boolean;
  maxHeightFraction: number;
}) {
  const videoStatus = set.video?.availabilityStatus ?? 'none';
  const canPlay = videoStatus === 'available' && !!set.video?.uri;

  return (
    <View style={[styles.pane, stacked ? styles.paneColumn : styles.paneRow]}>
      <AppText variant="label" color={colors.accent.primary}>
        {label}
      </AppText>
      <AppText variant="caption" numberOfLines={1}>
        {set.exerciseName}
      </AppText>
      <AppText variant="caption" muted>
        {formatPerformedAt(set.performedAt)}
      </AppText>
      {canPlay ? (
        <CompareVideoView
          player={player}
          width={set.video!.width}
          height={set.video!.height}
          thumbnailUri={set.video!.thumbnailUri}
          maxHeightFraction={maxHeightFraction}
        />
      ) : (
        <VideoPlaceholder status={videoStatus === 'none' ? 'unknown' : videoStatus} />
      )}
      <AppText variant="dataLarge">{formatSetLabel(set.weight, set.reps)}</AppText>
      {set.notes ? (
        <AppText variant="caption" muted numberOfLines={3}>
          {set.notes}
        </AppText>
      ) : null}
    </View>
  );
}

function TrimRow({
  label,
  window,
  player,
  onChange,
}: {
  label: string;
  window: TrimWindow;
  player: VideoPlayer;
  onChange: (next: TrimWindow) => void;
}) {
  const setStart = () => {
    const t = Math.max(0, player.currentTime);
    onChange({ start: window.end != null && t >= window.end ? window.end - 0.1 : t, end: window.end });
  };
  const setEnd = () => {
    const t = Math.max(0, player.currentTime);
    onChange({ start: window.start, end: t <= window.start ? window.start + 0.1 : t });
  };

  return (
    <View style={styles.trimRow}>
      <View style={styles.trimLabel}>
        <AppText variant="caption" muted>
          {label} trim
        </AppText>
        <AppText variant="dataMono">
          {window.start.toFixed(1)}s – {window.end != null ? `${window.end.toFixed(1)}s` : 'end'}
        </AppText>
      </View>
      <View style={styles.trimButtons}>
        <TrimButton label="Set start" onPress={setStart} />
        <TrimButton label="Set end" onPress={setEnd} />
        <TrimButton label="Reset" onPress={() => onChange(FULL_WINDOW)} />
      </View>
    </View>
  );
}

function TrimButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.trimButton}>
      <AppText variant="caption" color={colors.text.secondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

function ratioFrom(width?: number | null, height?: number | null): number | null {
  return width && height && width > 0 && height > 0 ? width / height : null;
}

/** A video view sized to the clip's upright aspect, driven by an external player. */
function CompareVideoView({
  player,
  width,
  height,
  thumbnailUri,
  maxHeightFraction,
}: {
  player: VideoPlayer;
  width?: number | null;
  height?: number | null;
  thumbnailUri?: string | null;
  maxHeightFraction: number;
}) {
  const window = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const [thumbnailAspect, setThumbnailAspect] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!thumbnailUri) {
      setThumbnailAspect(null);
      return;
    }
    Image.getSize(
      thumbnailUri,
      (w, h) => {
        if (active) setThumbnailAspect(ratioFrom(w, h));
      },
      () => {
        if (active) setThumbnailAspect(null);
      },
    );
    return () => {
      active = false;
    };
  }, [thumbnailUri]);

  const aspectRatio = thumbnailAspect ?? ratioFrom(width, height) ?? 16 / 9;
  const availableWidth = containerWidth || window.width / 2;
  const maxHeight = window.height * maxHeightFraction;

  let videoWidth = availableWidth;
  let videoHeight = availableWidth / aspectRatio;
  if (videoHeight > maxHeight) {
    videoHeight = maxHeight;
    videoWidth = maxHeight * aspectRatio;
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured && Math.abs(measured - containerWidth) > 1) setContainerWidth(measured);
  };

  return (
    <View style={styles.videoWrap} onLayout={onLayout}>
      <VideoView
        style={[styles.video, { width: videoWidth, height: videoHeight }]}
        player={player}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

function CandidateRow({
  candidate,
  selected,
  showExercise,
  onPress,
}: {
  candidate: CompareCandidate;
  selected: boolean;
  showExercise: boolean;
  onPress: () => void;
}) {
  const video = candidate.video;
  return (
    <Pressable onPress={onPress} style={[styles.candidate, selected && styles.candidateOn]}>
      {video?.thumbnailUri ? (
        <SetVideoThumbnail uri={video.thumbnailUri} width={video.width} height={video.height} />
      ) : null}
      <View style={styles.candidateBody}>
        <View style={styles.candidateTop}>
          <AppText variant="dataMono">{formatSetLabel(candidate.weight, candidate.reps)}</AppText>
          {candidate.comparable ? (
            <View style={styles.matchBadge}>
              <AppText variant="caption" color={colors.text.inverse}>
                Match
              </AppText>
            </View>
          ) : null}
        </View>
        {showExercise ? (
          <AppText variant="caption" numberOfLines={1}>
            {candidate.exerciseName}
          </AppText>
        ) : null}
        <AppText variant="caption" muted numberOfLines={1}>
          {candidate.sessionName ? `${candidate.sessionName} · ` : ''}
          {formatPerformedAt(candidate.performedAt)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  panesColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  pane: {
    gap: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
  },
  paneRow: {
    flex: 1,
  },
  paneColumn: {
    width: '100%',
  },
  emptyPane: {
    justifyContent: 'center',
    minHeight: 160,
  },
  center: {
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  trimLabel: {
    gap: 2,
  },
  trimButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trimButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.subtle,
  },
  videoWrap: {
    width: '100%',
    alignItems: 'center',
  },
  video: {
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    overflow: 'hidden',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.subtle,
  },
  chipOn: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  candidateOn: {
    borderColor: colors.accent.primary,
  },
  candidateBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  candidateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primary,
  },
});
