import { describe, expect, test } from 'bun:test';
import { AudioSessionCoordinator } from '../AudioSessionCoordinator';

function createMockHandle() {
  const calls = {
    play: 0,
    pause: 0,
    destroy: 0,
    seekTo: [] as number[],
  };

  return {
    calls,
    handle: {
      play: () => {
        calls.play += 1;
      },
      pause: () => {
        calls.pause += 1;
      },
      seekTo: (seconds: number) => {
        calls.seekTo.push(seconds);
      },
      destroy: () => {
        calls.destroy += 1;
      },
    },
  };
}

describe('AudioSessionCoordinator', () => {
  test('stops previous handle when a new session starts', () => {
    const coordinator = new AudioSessionCoordinator<ReturnType<typeof createMockHandle>['handle']>();
    const first = createMockHandle();

    const firstSession = coordinator.startNewSession();
    expect(coordinator.register(firstSession, first.handle)).toBe(true);
    expect(coordinator.getActiveHandle()).toBe(first.handle);

    coordinator.startNewSession();

    expect(first.calls.pause).toBe(1);
    expect(first.calls.destroy).toBe(1);
    expect(coordinator.getActiveHandle()).toBeNull();
  });

  test('rejects stale session registration and destroys stale handle', () => {
    const coordinator = new AudioSessionCoordinator<ReturnType<typeof createMockHandle>['handle']>();
    const active = createMockHandle();
    const stale = createMockHandle();

    const session1 = coordinator.startNewSession();
    expect(coordinator.register(session1, active.handle)).toBe(true);

    coordinator.startNewSession();
    expect(coordinator.register(session1, stale.handle)).toBe(false);

    expect(stale.calls.pause).toBe(1);
    expect(stale.calls.destroy).toBe(1);
    expect(coordinator.getActiveHandle()).toBeNull();
  });

  test('delegates controls to active handle only', () => {
    const coordinator = new AudioSessionCoordinator<ReturnType<typeof createMockHandle>['handle']>();
    const active = createMockHandle();
    const stale = createMockHandle();

    const session1 = coordinator.startNewSession();
    expect(coordinator.register(session1, stale.handle)).toBe(true);

    const session2 = coordinator.startNewSession();
    expect(coordinator.register(session2, active.handle)).toBe(true);

    coordinator.playActive();
    coordinator.pauseActive();
    coordinator.seekActive(42);

    expect(active.calls.play).toBe(1);
    expect(active.calls.pause).toBe(1);
    expect(active.calls.seekTo).toEqual([42]);
    expect(stale.calls.seekTo).toEqual([]);
  });

  test('dispose stops active handle and clears state', () => {
    const coordinator = new AudioSessionCoordinator<ReturnType<typeof createMockHandle>['handle']>();
    const active = createMockHandle();

    const session = coordinator.startNewSession();
    expect(coordinator.register(session, active.handle)).toBe(true);

    coordinator.dispose();

    expect(active.calls.pause).toBe(1);
    expect(active.calls.destroy).toBe(1);
    expect(coordinator.getActiveHandle()).toBeNull();
  });
});
