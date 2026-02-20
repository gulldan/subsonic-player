import { describe, expect, test } from 'bun:test';
import {
  playAllFromQueue,
  playOrToggleTrack,
  shuffleAndPlayFromQueue,
  type TrackListPlayer,
} from '../trackListPlayback';
import { createSong } from './helpers/songFactory';

function createPlayer(overrides?: Partial<TrackListPlayer>) {
  const calls = {
    playTrack: [] as Array<{ songId: string; index: number | undefined; queueLength: number | undefined }>,
    togglePlayPause: 0,
    toggleShuffle: 0,
  };

  const base: TrackListPlayer = {
    currentTrack: null,
    isShuffled: false,
    async playTrack(song, queue, index) {
      calls.playTrack.push({ songId: song.id, index, queueLength: queue?.length });
    },
    async togglePlayPause() {
      calls.togglePlayPause += 1;
    },
    toggleShuffle() {
      calls.toggleShuffle += 1;
    },
  };

  const player = { ...base, ...overrides };
  return { player, calls };
}

function createHapticsMock() {
  const calls = {
    impact: 0,
  };

  const haptics = {
    ImpactFeedbackStyle: {
      Medium: 'medium' as any,
    },
    impactAsync: async () => {
      calls.impact += 1;
    },
  } as NonNullable<Parameters<typeof playAllFromQueue>[2]>;

  return {
    calls,
    haptics,
  };
}

describe('trackListPlayback', () => {
  test('playOrToggleTrack toggles when pressing current track', async () => {
    const song = createSong('1');
    const { player, calls } = createPlayer({ currentTrack: song });

    await playOrToggleTrack(player, [song], song);

    expect(calls.togglePlayPause).toBe(1);
    expect(calls.playTrack).toHaveLength(0);
  });

  test('playOrToggleTrack plays requested track with resolved index', async () => {
    const first = createSong('1');
    const second = createSong('2');
    const { player, calls } = createPlayer({ currentTrack: first });

    await playOrToggleTrack(player, [first, second], second);

    expect(calls.togglePlayPause).toBe(0);
    expect(calls.playTrack).toEqual([{ songId: '2', index: 1, queueLength: 2 }]);
  });

  test('playOrToggleTrack falls back to index 0 when track is missing', async () => {
    const first = createSong('1');
    const missing = createSong('missing');
    const { player, calls } = createPlayer();

    await playOrToggleTrack(player, [first], missing);

    expect(calls.playTrack).toEqual([{ songId: 'missing', index: 0, queueLength: 1 }]);
  });

  test('playAllFromQueue is a no-op for empty queue', async () => {
    const { player, calls } = createPlayer();
    const { calls: hapticCalls, haptics } = createHapticsMock();

    await playAllFromQueue(player, [], haptics);

    expect(calls.playTrack).toHaveLength(0);
    expect(hapticCalls.impact).toBe(0);
  });

  test('playAllFromQueue triggers haptics and starts first song', async () => {
    const first = createSong('1');
    const second = createSong('2');
    const { player, calls } = createPlayer();
    const { calls: hapticCalls, haptics } = createHapticsMock();

    await playAllFromQueue(player, [first, second], haptics);

    expect(hapticCalls.impact).toBe(1);
    expect(calls.playTrack).toEqual([{ songId: '1', index: 0, queueLength: 2 }]);
  });

  test('shuffleAndPlayFromQueue enables shuffle before playback when needed', async () => {
    const first = createSong('1');
    const { player, calls } = createPlayer({ isShuffled: false });
    const { calls: hapticCalls, haptics } = createHapticsMock();

    await shuffleAndPlayFromQueue(player, [first], haptics, () => 0.1);

    expect(hapticCalls.impact).toBe(1);
    expect(calls.toggleShuffle).toBe(1);
    expect(calls.playTrack).toEqual([{ songId: '1', index: 0, queueLength: 1 }]);
  });

  test('shuffleAndPlayFromQueue does not toggle shuffle when it is already enabled', async () => {
    const first = createSong('1');
    const { player, calls } = createPlayer({ isShuffled: true });
    const { calls: hapticCalls, haptics } = createHapticsMock();

    await shuffleAndPlayFromQueue(player, [first], haptics, () => 0.1);

    expect(hapticCalls.impact).toBe(1);
    expect(calls.toggleShuffle).toBe(0);
    expect(calls.playTrack).toEqual([{ songId: '1', index: 0, queueLength: 1 }]);
  });

  test('shuffleAndPlayFromQueue starts from random index for multi-track queue', async () => {
    const first = createSong('1');
    const second = createSong('2');
    const third = createSong('3');
    const { player, calls } = createPlayer({ isShuffled: false });
    const { haptics } = createHapticsMock();

    await shuffleAndPlayFromQueue(player, [first, second, third], haptics, () => 0.95);

    expect(calls.toggleShuffle).toBe(1);
    expect(calls.playTrack).toEqual([{ songId: '3', index: 2, queueLength: 3 }]);
  });
});
