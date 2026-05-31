import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { getSetTypeBadgeStyle } from '@/lib/theme/set-type-styles';
import { radius, spacing } from '@/lib/theme/tokens';
import { SET_TYPE_LABELS, type SetType } from '@/types/domain';

type SetTypeBadgeProps = {
  setType: SetType;
};

export function SetTypeBadge({ setType }: SetTypeBadgeProps) {
  const badgeStyle = getSetTypeBadgeStyle(setType);
  const label = SET_TYPE_LABELS[setType];

  return (
    <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
      <AppText variant="caption" color={badgeStyle.color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
