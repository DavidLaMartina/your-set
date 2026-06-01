import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/lib/theme/tokens';

const ACTION_WIDTH = 92;

type IconName = ComponentProps<typeof Ionicons>['name'];

export type SwipeRevealTone = 'danger' | 'archive';

export type SwipeRevealAction = {
  label: string;
  icon: IconName;
  tone: SwipeRevealTone;
  onPress: () => void;
  accessibilityLabel?: string;
};

type Props = {
  children: React.ReactNode;
  action: SwipeRevealAction;
  enabled?: boolean;
};

export function SwipeRevealRow({ children, action, enabled = true }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const handlePress = () => {
    swipeRef.current?.close();
    action.onPress();
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [0, ACTION_WIDTH],
      extrapolate: 'clamp',
    });

    const actionStyle =
      action.tone === 'danger' ? styles.dangerAction : styles.archiveAction;

    return (
      <Animated.View style={[styles.actionWrap, { transform: [{ translateX }] }]}>
        <Pressable
          style={[styles.action, actionStyle]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel ?? action.label}>
          <Ionicons name={action.icon} size={22} color={colors.text.primary} />
          <AppText variant="caption" style={styles.actionLabel}>
            {action.label}
          </AppText>
        </Pressable>
      </Animated.View>
    );
  };

  if (!enabled) {
    return <View style={styles.row}>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}>
      <View style={styles.row}>{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  actionWrap: {
    width: ACTION_WIDTH,
    marginLeft: spacing.sm,
  },
  action: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dangerAction: {
    backgroundColor: colors.accent.danger,
  },
  archiveAction: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionLabel: {
    color: colors.text.primary,
  },
});
