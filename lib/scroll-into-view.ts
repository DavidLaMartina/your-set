import { type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type ScrollView,
  type View,
} from 'react-native';

const GAP_ABOVE_KEYBOARD = 20;

/**
 * Scroll a ScrollView so `target` sits above the software keyboard.
 * Works when the keyboard is already visible or about to show.
 */
export function scrollIntoViewAboveKeyboard(
  scrollRef: RefObject<ScrollView | null>,
  targetRef: RefObject<View | null>,
  getScrollY: () => number,
): void {
  const scroll = scrollRef.current;
  const target = targetRef.current;
  if (!scroll || !target) return;

  const apply = (keyboardScreenY: number) => {
    target.measureInWindow((_x, y, _w, height) => {
      const rowBottom = y + height;
      const visibleBottom = keyboardScreenY - GAP_ABOVE_KEYBOARD;
      if (rowBottom <= visibleBottom) return;

      scroll.scrollTo({
        y: getScrollY() + (rowBottom - visibleBottom),
        animated: true,
      });
    });
  };

  const metrics = Keyboard.metrics();
  if (metrics?.height) {
    const windowHeight = Dimensions.get('window').height;
    apply(windowHeight - metrics.height);
    return;
  }

  const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const sub = Keyboard.addListener(eventName, (e) => {
    apply(e.endCoordinates.screenY);
    sub.remove();
  });
}
