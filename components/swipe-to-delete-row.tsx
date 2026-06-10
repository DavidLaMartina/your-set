import { Alert } from 'react-native';

import { SwipeRevealRow } from '@/components/swipe-reveal-row';

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
  /** When false, hide swipe entirely. */
  enabled?: boolean;
  /**
   * When false, swipe reveals a greyed delete affordance (e.g. workout-owned
   * sets that must be removed from the workout screen).
   */
  deletable?: boolean;
  blockedReason?: string;
};

export function SwipeToDeleteRow({
  children,
  onDelete,
  enabled = true,
  deletable = true,
  blockedReason = 'This item cannot be deleted here.',
}: Props) {
  return (
    <SwipeRevealRow
      enabled={enabled}
      action={{
        label: 'Delete',
        icon: 'trash-outline',
        tone: 'danger',
        onPress: onDelete,
        accessibilityLabel: deletable ? 'Delete' : 'Delete unavailable',
        disabled: !deletable,
        onDisabledPress: () => {
          Alert.alert('Cannot delete here', blockedReason);
        },
      }}>
      {children}
    </SwipeRevealRow>
  );
}
