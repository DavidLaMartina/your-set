import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/lib/theme/tokens';

const DEFAULT_ASPECT_RATIO = 16 / 9;
/** Keeps list rows near their pre-thumbnail height; portrait scales down in width. */
const MAX_THUMB_HEIGHT = 72;

function ratioFrom(width?: number | null, height?: number | null): number | null {
  return width && height && width > 0 && height > 0 ? width / height : null;
}

function thumbDimensions(slotWidth: number, aspectRatio: number): { width: number; height: number } {
  let thumbWidth = slotWidth;
  let thumbHeight = thumbWidth / aspectRatio;
  if (thumbHeight > MAX_THUMB_HEIGHT) {
    thumbHeight = MAX_THUMB_HEIGHT;
    thumbWidth = MAX_THUMB_HEIGHT * aspectRatio;
  }
  return { width: thumbWidth, height: thumbHeight };
}

type Props = {
  uri: string;
  /** Stored display-corrected dimensions (fallback before measurement). */
  width?: number | null;
  height?: number | null;
};

/**
 * List-row video preview sized to the thumbnail's true aspect ratio (portrait or
 * landscape). Measures the upright thumbnail image — encoded track dimensions
 * are often landscape for rotated portrait clips.
 */
export function SetVideoThumbnail({ uri, width, height }: Props) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(() => ratioFrom(width, height));
  const [slotWidth, setSlotWidth] = useState(0);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (active) setAspectRatio(ratioFrom(w, h));
      },
      () => {
        if (active) setAspectRatio(ratioFrom(width, height) ?? DEFAULT_ASPECT_RATIO);
      },
    );
    return () => {
      active = false;
    };
  }, [uri, width, height]);

  const ratio = aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const { width: thumbWidth, height: thumbHeight } =
    slotWidth > 0 ? thumbDimensions(slotWidth, ratio) : { width: 0, height: 0 };

  return (
    <View style={styles.slot} onLayout={(e) => setSlotWidth(e.nativeEvent.layout.width)}>
      {thumbWidth > 0 && thumbHeight > 0 ? (
        <Image
          source={{ uri }}
          style={{ width: thumbWidth, height: thumbHeight, borderRadius: radius.sm }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.placeholder, { height: MAX_THUMB_HEIGHT }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  placeholder: {
    width: '100%',
    maxHeight: MAX_THUMB_HEIGHT,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
  },
});
