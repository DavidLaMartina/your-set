import { forwardRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView as ScrollViewType,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/lib/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ScrollBody = forwardRef<
  ScrollViewType,
  {
    children: ReactNode;
    paddingStyle?: ViewStyle;
    contentStyle?: ViewStyle;
    onScroll?: ScreenProps['onScroll'];
  }
>(function ScrollBody({ children, paddingStyle, contentStyle, onScroll }, ref) {
  return (
    <ScrollView
      ref={ref}
      contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}>
      {children}
    </ScrollView>
  );
});

export const Screen = forwardRef<ScrollViewType, ScreenProps>(function Screen(
  { children, scroll = true, padded = true, style, contentStyle, onScroll },
  ref,
) {
  const paddingStyle = padded ? { paddingHorizontal: spacing.lg } : undefined;

  if (scroll) {
    const body = (
      <ScrollBody
        ref={ref}
        paddingStyle={paddingStyle}
        contentStyle={contentStyle}
        onScroll={onScroll}>
        {children}
      </ScrollBody>
    );

    return (
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
        {Platform.OS === 'android' ? (
          <KeyboardAvoidingView style={styles.fill} behavior="height">
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <View style={[styles.fill, paddingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.lg,
  },
});
