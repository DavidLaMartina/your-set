import { Alert } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
};

export function confirmDestructive({ title, message, onConfirm }: ConfirmOptions): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => void onConfirm(),
    },
  ]);
}

export function confirmArchiveSession(name: string, onConfirm: () => void | Promise<void>): void {
  Alert.alert(
    `Archive “${name}”?`,
    'Moves this session out of your rotation. Past workouts stay linked until you delete the archived session.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: () => void onConfirm() },
    ],
  );
}

export function confirmDeleteArchivedSession(
  name: string,
  workoutCount: number,
  onConfirm: () => void | Promise<void>,
): void {
  const workoutNote =
    workoutCount > 0
      ? `${workoutCount} workout${workoutCount === 1 ? '' : 's'} tied to this session will become ad-hoc (no longer linked to “${name}”). `
      : '';

  confirmDestructive({
    title: `Delete “${name}” permanently?`,
    message: `${workoutNote}Planned exercises are removed. Sets you already logged are kept in your history.`,
    onConfirm,
  });
}
