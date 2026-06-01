import { SwipeRevealRow } from '@/components/swipe-reveal-row';

type Props = {
  children: React.ReactNode;
  onArchive: () => void;
  enabled?: boolean;
};

export function SwipeToArchiveRow({ children, onArchive, enabled = true }: Props) {
  return (
    <SwipeRevealRow
      enabled={enabled}
      action={{
        label: 'Archive',
        icon: 'archive-outline',
        tone: 'archive',
        onPress: onArchive,
        accessibilityLabel: 'Archive session',
      }}>
      {children}
    </SwipeRevealRow>
  );
}
