import type { RepeatMode } from '@/features/player/core/domain/types';

export function cycleRepeatMode(mode: RepeatMode): RepeatMode {
  switch (mode) {
    case 'off':
      return 'all';
    case 'all':
      return 'one';
    default:
      return 'off';
  }
}

export function resolveNextQueueIndex(length: number, currentIndex: number, repeatMode: RepeatMode): number | null {
  if (length <= 0) return null;
  if (currentIndex < length - 1) return currentIndex + 1;
  if (repeatMode === 'all') return 0;
  return null;
}

export function resolvePreviousQueueIndex(length: number, currentIndex: number, repeatMode: RepeatMode): number | null {
  if (length <= 0) return null;
  if (currentIndex > 0) return currentIndex - 1;
  if (repeatMode === 'all') return length - 1;
  return null;
}

export function resolveRandomQueueIndex(
  length: number,
  currentIndex?: number,
  random: () => number = Math.random,
): number | null {
  if (length <= 0) return null;
  if (length === 1) return 0;

  const normalized = Math.max(0, Math.min(0.999999, random()));
  let randomIndex = Math.floor(normalized * length);

  if (currentIndex !== undefined && currentIndex >= 0 && currentIndex < length && randomIndex === currentIndex) {
    randomIndex = (currentIndex + 1) % length;
  }

  return randomIndex;
}
