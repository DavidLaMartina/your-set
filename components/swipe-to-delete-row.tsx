import { SwipeRevealRow } from '@/components/swipe-reveal-row';

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
  enabled?: boolean;
};

export function SwipeToDeleteRow({ children, onDelete, enabled = true }: Props) {
  return (
    <SwipeRevealRow
      enabled={enabled}
      action={{
        label: 'Delete',
        icon: 'trash-outline',
        tone: 'danger',
        onPress: onDelete,
        accessibilityLabel: 'Delete',
      }}>
      {children}
    </SwipeRevealRow>
  );
}
