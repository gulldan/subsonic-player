import { describe, expect, test } from 'bun:test';
import {
  cycleRepeatMode,
  resolveNextQueueIndex,
  resolvePreviousQueueIndex,
  resolveRandomQueueIndex,
} from '@/features/player/core/domain/playback';

describe('playback domain helpers', () => {
  test('cycleRepeatMode cycles off -> all -> one -> off', () => {
    expect(cycleRepeatMode('off')).toBe('all');
    expect(cycleRepeatMode('all')).toBe('one');
    expect(cycleRepeatMode('one')).toBe('off');
  });

  test('resolveNextQueueIndex respects repeat mode', () => {
    expect(resolveNextQueueIndex(0, 0, 'off')).toBeNull();
    expect(resolveNextQueueIndex(3, 0, 'off')).toBe(1);
    expect(resolveNextQueueIndex(3, 2, 'off')).toBeNull();
    expect(resolveNextQueueIndex(3, 2, 'all')).toBe(0);
  });

  test('resolvePreviousQueueIndex respects repeat mode', () => {
    expect(resolvePreviousQueueIndex(0, 0, 'off')).toBeNull();
    expect(resolvePreviousQueueIndex(3, 2, 'off')).toBe(1);
    expect(resolvePreviousQueueIndex(3, 0, 'off')).toBeNull();
    expect(resolvePreviousQueueIndex(3, 0, 'all')).toBe(2);
  });

  test('resolveRandomQueueIndex returns null for empty queue', () => {
    expect(resolveRandomQueueIndex(0)).toBeNull();
  });

  test('resolveRandomQueueIndex avoids current index when possible', () => {
    expect(resolveRandomQueueIndex(3, 1, () => 0.4)).toBe(2);
    expect(resolveRandomQueueIndex(3, 2, () => 0.1)).toBe(0);
  });

  test('resolveRandomQueueIndex clamps invalid random values', () => {
    expect(resolveRandomQueueIndex(4, undefined, () => -1)).toBe(0);
    expect(resolveRandomQueueIndex(4, undefined, () => 5)).toBe(3);
  });
});
