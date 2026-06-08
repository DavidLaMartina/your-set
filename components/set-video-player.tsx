import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';

import { colors, radius } from '@/lib/theme/tokens';

type Props = {
  uri: string;
  aspectRatio?: number;
};

export function SetVideoPlayer({ uri, aspectRatio = 16 / 9 }: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  return (
    <VideoView
      style={[styles.video, { aspectRatio }]}
      player={player}
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    overflow: 'hidden',
  },
});
