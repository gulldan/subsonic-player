import { describe, expect, test } from 'bun:test';
import { AudioSessionCoordinator } from '@/features/player/core/application/session/AudioSessionCoordinator';
import { playOrToggleTrack, type TrackListPlayer } from '@/features/player/core/application/trackListPlayback';
import { createSong } from '../../__tests__/helpers/songFactory';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class MockHandle {
  readonly songId: string;
  playCalls = 0;
  pauseCalls = 0;
  destroyCalls = 0;
  private playing = false;

  constructor(songId: string) {
    this.songId = songId;
  }

  play() {
    this.playCalls += 1;
    this.playing = true;
  }

  pause() {
    this.pauseCalls += 1;
    this.playing = false;
  }

  seekTo() {}

  destroy() {
    this.destroyCalls += 1;
    this.playing = false;
  }

  getCurrentTime() {
    return 0;
  }

  getDuration() {
    return 0;
  }

  getIsPlaying() {
    return this.playing;
  }
}

function createHarness(loadDelayBySongId?: Record<string, number>) {
  const coordinator = new AudioSessionCoordinator<MockHandle>();
  const handlesBySongId = new Map<string, MockHandle[]>();

  const pushHandle = (handle: MockHandle) => {
    const existing = handlesBySongId.get(handle.songId) ?? [];
    existing.push(handle);
    handlesBySongId.set(handle.songId, existing);
  };

  const getLastHandle = (songId: string): MockHandle | null => {
    const handles = handlesBySongId.get(songId);
    return handles && handles.length > 0 ? handles[handles.length - 1] : null;
  };

  const player: TrackListPlayer = {
    currentTrack: null,
    isShuffled: false,
    async playTrack(song) {
      const sessionId = coordinator.startNewSession();
      const delay = loadDelayBySongId?.[song.id] ?? 0;
      if (delay > 0) {
        await sleep(delay);
      }

      const handle = new MockHandle(song.id);
      pushHandle(handle);

      const registered = coordinator.register(sessionId, handle);
      if (!registered) return;

      player.currentTrack = song;
      handle.play();
    },
    async togglePlayPause() {
      const activeHandle = coordinator.getActiveHandle();
      if (!activeHandle) return;
      if (activeHandle.getIsPlaying()) {
        activeHandle.pause();
      } else {
        activeHandle.play();
      }
    },
    toggleShuffle() {
      player.isShuffled = !player.isShuffled;
    },
  };

  return { player, coordinator, getLastHandle };
}

describe('Player playback flow integration', () => {
  test('starting another track stops and destroys previous track handle', async () => {
    const first = createSong('first');
    const second = createSong('second');
    const queue = [first, second];
    const { player, coordinator, getLastHandle } = createHarness();

    await playOrToggleTrack(player, queue, first);
    const firstHandle = getLastHandle(first.id);
    expect(firstHandle).not.toBeNull();
    expect(firstHandle?.getIsPlaying()).toBe(true);

    await playOrToggleTrack(player, queue, second);

    expect(firstHandle?.pauseCalls).toBe(1);
    expect(firstHandle?.destroyCalls).toBe(1);
    expect(firstHandle?.getIsPlaying()).toBe(false);

    const secondHandle = getLastHandle(second.id);
    expect(secondHandle).not.toBeNull();
    expect(secondHandle?.getIsPlaying()).toBe(true);
    expect(coordinator.getActiveHandle()).toBe(secondHandle);
  });

  test('pressing currently active track toggles pause and resume', async () => {
    const song = createSong('single');
    const queue = [song];
    const { player, coordinator } = createHarness();

    await playOrToggleTrack(player, queue, song);
    const activeHandle = coordinator.getActiveHandle();
    expect(activeHandle).not.toBeNull();
    expect(activeHandle?.getIsPlaying()).toBe(true);

    await playOrToggleTrack(player, queue, song);
    expect(activeHandle?.getIsPlaying()).toBe(false);
    expect(activeHandle?.pauseCalls).toBe(1);

    await playOrToggleTrack(player, queue, song);
    expect(activeHandle?.getIsPlaying()).toBe(true);
    expect(activeHandle?.playCalls).toBe(2);
  });

  test('rapid track switches keep only the latest session active', async () => {
    const slow = createSong('slow');
    const fast = createSong('fast');
    const queue = [slow, fast];
    const { player, coordinator, getLastHandle } = createHarness({
      slow: 30,
      fast: 0,
    });

    await Promise.all([playOrToggleTrack(player, queue, slow), playOrToggleTrack(player, queue, fast)]);

    const slowHandle = getLastHandle(slow.id);
    const fastHandle = getLastHandle(fast.id);

    expect(slowHandle).not.toBeNull();
    expect(fastHandle).not.toBeNull();
    expect(slowHandle?.destroyCalls).toBe(1);
    expect(slowHandle?.getIsPlaying()).toBe(false);

    expect(fastHandle?.getIsPlaying()).toBe(true);
    expect(player.currentTrack?.id).toBe(fast.id);
    expect(coordinator.getActiveHandle()).toBe(fastHandle);
  });
});
