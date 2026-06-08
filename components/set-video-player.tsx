import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { generateThumbnail } from '@/lib/media/availability';
import { colors, radius } from '@/lib/theme/tokens';

type Props = {
  uri: string;
  /** Stored display-corrected dimensions (from the thumbnail at attach time). */
  width?: number | null;
  height?: number | null;
  /** Thumbnail URI — measured at runtime for a reliable, rotation-correct aspect. */
  thumbnailUri?: string | null;
  /** Cap player height as a fraction of the window height (keeps portrait sane). */
  maxHeightFraction?: number;
};

const DEFAULT_ASPECT_RATIO = 16 / 9;

function ratioFrom(width?: number | null, height?: number | null): number | null {
  return width && height && width > 0 && height > 0 ? width / height : null;
}

export function SetVideoPlayer({
  uri,
  width,
  height,
  thumbnailUri,
  maxHeightFraction = 0.6,
}: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  // expo-video and the image picker both report the *encoded* track size, which
  // is landscape for rotated portrait clips (the player still renders upright).
  // The thumbnail image is written upright, so measuring it gives the only
  // reliable display aspect. We fall back to the player track size, then stored
  // dimensions, then 16:9.
  const sourceLoad = useEvent(player, 'sourceLoad');
  const window = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const [thumbnailAspect, setThumbnailAspect] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const measure = (source: string) =>
      Image.getSize(
        source,
        (w, h) => {
          if (active) setThumbnailAspect(ratioFrom(w, h));
        },
        () => {
          if (active) setThumbnailAspect(null);
        },
      );

    if (thumbnailUri) {
      measure(thumbnailUri);
    } else {
      // No stored thumbnail (generation may have failed at attach) — generate one
      // now purely to read the upright display aspect.
      generateThumbnail(uri).then((thumb) => {
        if (active && thumb?.uri) measure(thumb.uri);
      });
    }
    return () => {
      active = false;
    };
  }, [thumbnailUri, uri]);

  const trackSize =
    sourceLoad?.availableVideoTracks?.[0]?.size ?? player.availableVideoTracks?.[0]?.size ?? null;

  const aspectRatio =
    thumbnailAspect ??
    ratioFrom(trackSize?.width, trackSize?.height) ??
    ratioFrom(width, height) ??
    DEFAULT_ASPECT_RATIO;

  const availableWidth = containerWidth || window.width;
  const maxHeight = window.height * maxHeightFraction;

  let videoWidth = availableWidth;
  let videoHeight = availableWidth / aspectRatio;
  if (videoHeight > maxHeight) {
    videoHeight = maxHeight;
    videoWidth = maxHeight * aspectRatio;
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured && Math.abs(measured - containerWidth) > 1) {
      setContainerWidth(measured);
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <VideoView
        style={[styles.video, { width: videoWidth, height: videoHeight }]}
        player={player}
        contentFit="contain"
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  video: {
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    overflow: 'hidden',
  },
});
