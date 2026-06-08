import { StyleSheet, View } from 'react-native';

import { MissingVideo } from '@/components/missing-video';
import { PrimaryButton } from '@/components/primary-button';
import { SetVideoPlayer } from '@/components/set-video-player';
import { VideoPlaceholder } from '@/components/video-placeholder';
import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/lib/theme/tokens';
import type { SetVideo } from '@/types/domain';

/** A video picked but not yet persisted (create flow, before the set exists). */
export type StagedVideo = {
  uri: string;
  width: number | null;
  height: number | null;
};

type Props = {
  /** Persisted reference for an existing set. */
  video?: SetVideo | null;
  /** Picked-but-unsaved video, shown as a preview before the set is created. */
  staged?: StagedVideo | null;
  busy?: boolean;
  /** Pick a video to attach (or replace the current one). */
  onAttach: () => void;
  /** Remove the attached/staged video. */
  onRemove: () => void;
};

/**
 * Shared video UI for the set screens: plays the attached video, surfaces a
 * missing state with relink/remove, or offers an attach CTA. Works with either
 * a persisted {@link SetVideo} or a {@link StagedVideo} preview.
 */
export function SetVideoSection({ video, staged, busy, onAttach, onRemove }: Props) {
  const status = video?.availabilityStatus ?? 'none';
  const canPlayPersisted = status === 'available' && !!video?.uri;
  const isMissing = status === 'missing' || status === 'permissionDenied';

  return (
    <View style={styles.section}>
      <AppText variant="titleMedium">Video</AppText>

      {staged ? (
        <>
          <SetVideoPlayer uri={staged.uri} width={staged.width} height={staged.height} />
          <PrimaryButton
            label={busy ? 'Working…' : 'Replace video'}
            variant="ghost"
            onPress={onAttach}
          />
          <PrimaryButton label="Remove video" variant="danger" onPress={onRemove} />
        </>
      ) : canPlayPersisted ? (
        <>
          <SetVideoPlayer
            uri={video!.uri!}
            width={video!.width}
            height={video!.height}
            thumbnailUri={video!.thumbnailUri}
          />
          <PrimaryButton
            label={busy ? 'Working…' : 'Replace video'}
            variant="ghost"
            onPress={onAttach}
          />
          <PrimaryButton label="Remove video reference" variant="danger" onPress={onRemove} />
        </>
      ) : isMissing ? (
        <MissingVideo onRelink={onAttach} onRemove={onRemove} />
      ) : (
        <>
          <VideoPlaceholder status="none" onPress={onAttach} />
          <PrimaryButton label={busy ? 'Opening…' : 'Attach video'} onPress={onAttach} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
