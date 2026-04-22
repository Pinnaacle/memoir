import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export const SAVE_SUCCESS_FEEDBACK_MS = 480;

function canUseHaptics() {
  return Platform.OS !== 'web';
}

export function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getSaveLabel(state: SaveState, idleLabel = 'Save') {
  switch (state) {
    case 'saving':
      return 'Saving...';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Retry';
    case 'idle':
    default:
      return idleLabel;
  }
}

export async function triggerTapFeedback() {
  if (!canUseHaptics()) {
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function triggerSelectionFeedback() {
  if (!canUseHaptics()) {
    return;
  }

  await Haptics.selectionAsync();
}

export async function triggerSuccessFeedback() {
  if (!canUseHaptics()) {
    return;
  }

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function triggerErrorFeedback() {
  if (!canUseHaptics()) {
    return;
  }

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export async function triggerDestructiveFeedback() {
  if (!canUseHaptics()) {
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
