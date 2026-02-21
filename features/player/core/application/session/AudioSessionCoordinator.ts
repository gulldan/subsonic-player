interface ManagedAudioHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  destroy: () => void;
}

export function stopHandleSafely(handle: ManagedAudioHandle): void {
  try {
    handle.pause();
  } catch {}

  try {
    handle.destroy();
  } catch {}
}

export class AudioSessionCoordinator<THandle extends ManagedAudioHandle> {
  private activeSessionId = 0;
  private handles = new Map<number, THandle>();

  startNewSession(): number {
    this.activeSessionId += 1;
    this.stopAll();
    return this.activeSessionId;
  }

  register(sessionId: number, handle: THandle): boolean {
    if (!this.isActive(sessionId)) {
      stopHandleSafely(handle);
      return false;
    }

    this.handles.set(sessionId, handle);
    this.stopAllExcept(sessionId);
    return true;
  }

  isActive(sessionId: number): boolean {
    return sessionId === this.activeSessionId;
  }

  getActiveHandle(): THandle | null {
    return this.handles.get(this.activeSessionId) ?? null;
  }

  pauseActive(): void {
    this.getActiveHandle()?.pause();
  }

  playActive(): void {
    this.getActiveHandle()?.play();
  }

  seekActive(seconds: number): void {
    this.getActiveHandle()?.seekTo(seconds);
  }

  stopAll(): void {
    for (const [sessionId, handle] of this.handles.entries()) {
      stopHandleSafely(handle);
      this.handles.delete(sessionId);
    }
  }

  dispose(): void {
    this.stopAll();
  }

  private stopAllExcept(activeSessionId: number): void {
    for (const [sessionId, handle] of this.handles.entries()) {
      if (sessionId === activeSessionId) continue;
      stopHandleSafely(handle);
      this.handles.delete(sessionId);
    }
  }
}
