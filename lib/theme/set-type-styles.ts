import type { SetType } from '@/types/domain';
import { colors } from '@/lib/theme/tokens';

export function getSetTypeBadgeStyle(setType: SetType): {
  backgroundColor: string;
  color: string;
} {
  switch (setType) {
    case 'top_set':
      return { backgroundColor: 'rgba(201, 162, 39, 0.2)', color: colors.accent.primary };
    case 'backoff':
      return { backgroundColor: colors.bg.subtle, color: colors.text.secondary };
    case 'drop_set':
    case 'rest_pause':
    case 'myo_rep':
      return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: colors.accent.secondary };
    default:
      return { backgroundColor: colors.bg.subtle, color: colors.text.muted };
  }
}
