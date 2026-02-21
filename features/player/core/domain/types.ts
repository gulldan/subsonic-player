import type { Song } from '@/shared/api/subsonic/types';

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerContextValue {
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  duration: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
  loadError: string | null;
  playTrack: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playRandom: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  moveInQueue: (from: number, to: number) => void;
  retryPlay: () => Promise<void>;
}

export interface AudioHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
}

export type RefObject<T> = { current: T };
export type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export interface PositionStore {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => number;
}
