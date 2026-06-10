import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { SetVideoThumbnail } from '@/components/set-video-thumbnail';
import { SwipeToDeleteRow } from '@/components/swipe-to-delete-row';
import { AppText } from '@/components/ui/app-text';
import type { RecentSetRow } from '@/features/sets/services/recent-sets-service';
import { formatPerformedAt, formatSetLabel } from '@/lib/format';
import { setDetailHref } from '@/lib/navigation';
import { spacing } from '@/lib/theme/tokens';

type Props = {
  row: RecentSetRow;
  /** Hide when the list is already scoped to one exercise. */
  showExerciseName?: boolean;
  onDelete?: (setId: string) => void;
};

export function SetListCard({ row, showExerciseName = true, onDelete }: Props) {
  const video =
    row.video?.availabilityStatus === 'available' ? row.video : null;
  const deletable = row.sessionInstanceId == null;
  const blockedReason = row.sessionName
    ? `This set was logged during “${row.sessionName}”. Delete it from that workout.`
    : 'This set was logged during a workout. Delete it from that workout.';

  const card = (
    <Card onPress={() => router.push(setDetailHref(row.id))}>
      <View style={styles.cardRow}>
        <View style={styles.setContent}>
          <AppText variant="dataLarge">{formatSetLabel(row.weight, row.reps)}</AppText>
          {showExerciseName ? (
            <AppText variant="body" numberOfLines={2}>
              {row.exerciseName}
            </AppText>
          ) : null}
          <AppText variant="caption" muted numberOfLines={2}>
            {row.sessionName ? row.sessionName : 'No workout'}
            {row.manufacturerName ? ` · ${row.manufacturerName}` : ''}
            {' · '}
            {formatPerformedAt(row.performedAt)}
          </AppText>
        </View>
        {video?.thumbnailUri ? (
          <SetVideoThumbnail
            uri={video.thumbnailUri}
            width={video.width}
            height={video.height}
          />
        ) : null}
      </View>
    </Card>
  );

  if (!onDelete) return card;

  return (
    <SwipeToDeleteRow
      deletable={deletable}
      blockedReason={blockedReason}
      onDelete={() => onDelete(row.id)}>
      {card}
    </SwipeToDeleteRow>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setContent: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
});
