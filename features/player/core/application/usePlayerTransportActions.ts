import { useCallback } from 'react';
import {
  resolveNextQueueIndex,
  resolvePreviousQueueIndex,
  resolveRandomQueueIndex,
} from '@/features/player/core/domain/playback';
import { shuffleArray } from '@/features/player/core/domain/queue';
import type { AudioHandle } from '@/features/player/core/domain/types';
import type { Song } from '@/shared/api/subsonic/types';

type RefObject<T> = { current: T };
type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

interface UsePlayerTransportActionsArgs {
  getActiveQueue: () => Song[];
  loadAndPlay: (song: Song) => Promise<void>;
  emitPosition: (positionMs: number, force?: boolean) => void;
  audioRef: RefObject<AudioHandle | null>;
  sessionCoordinatorRef: RefObject<{
    pauseActive: () => void;
    getActiveHandle: () => AudioHandle | null;
  }>;
  playbackIntentRef: RefObject<boolean>;
  isLoadingRef: RefObject<boolean>;
  isShuffledRef: RefObject<boolean>;
  queueRef: RefObject<Song[]>;
  shuffledQueueRef: RefObject<Song[]>;
  queueIndexRef: RefObject<number>;
  currentTrackRef: RefObject<Song | null>;
  durationRef: RefObject<number>;
  isPlayingRef: RefObject<boolean>;
  positionRef: RefObject<number>;
  repeatModeRef: RefObject<'off' | 'one' | 'all'>;
  setCurrentTrack: StateSetter<Song | null>;
  setQueue: StateSetter<Song[]>;
  setShuffledQueue: StateSetter<Song[]>;
  setQueueIndex: StateSetter<number>;
  setIsPlaying: StateSetter<boolean>;
  setDuration: StateSetter<number>;
}

export function usePlayerTransportActions({
  getActiveQueue,
  loadAndPlay,
  emitPosition,
  audioRef,
  sessionCoordinatorRef,
  playbackIntentRef,
  isLoadingRef,
  isShuffledRef,
  queueRef,
  shuffledQueueRef,
  queueIndexRef,
  currentTrackRef,
  durationRef,
  isPlayingRef,
  positionRef,
  repeatModeRef,
  setCurrentTrack,
  setQueue,
  setShuffledQueue,
  setQueueIndex,
  setIsPlaying,
  setDuration,
}: UsePlayerTransportActionsArgs) {
  const playTrack = useCallback(
    async (song: Song, newQueue?: Song[], index?: number) => {
      playbackIntentRef.current = true;
      setCurrentTrack(song);
      emitPosition(0, true);
      const nextDuration = song.duration ? song.duration * 1000 : 0;
      durationRef.current = nextDuration;
      setDuration(nextDuration);
      isPlayingRef.current = true;
      setIsPlaying(true);

      if (newQueue) {
        queueRef.current = newQueue;
        setQueue(newQueue);
        const idx = index ?? newQueue.findIndex((item) => item.id === song.id);
        const resolvedIdx = idx >= 0 ? idx : 0;
        queueIndexRef.current = resolvedIdx;
        setQueueIndex(resolvedIdx);

        if (isShuffledRef.current) {
          const others = newQueue.filter((_, i) => i !== resolvedIdx);
          const shuffled = [song, ...shuffleArray(others)];
          shuffledQueueRef.current = shuffled;
          setShuffledQueue(shuffled);
          queueIndexRef.current = 0;
          setQueueIndex(0);
        }
      } else {
        const activeQueue = getActiveQueue();
        const existingIdx = activeQueue.findIndex((item) => item.id === song.id);
        if (existingIdx >= 0) {
          queueIndexRef.current = existingIdx;
          setQueueIndex(existingIdx);
        } else {
          queueRef.current = [song];
          setQueue([song]);
          queueIndexRef.current = 0;
          setQueueIndex(0);
          if (isShuffledRef.current) {
            shuffledQueueRef.current = [song];
            setShuffledQueue([song]);
          }
        }
      }

      await loadAndPlay(song);
    },
    [
      durationRef,
      emitPosition,
      getActiveQueue,
      isPlayingRef,
      isShuffledRef,
      loadAndPlay,
      playbackIntentRef,
      queueIndexRef,
      queueRef,
      setCurrentTrack,
      setDuration,
      setIsPlaying,
      setQueue,
      setQueueIndex,
      setShuffledQueue,
      shuffledQueueRef,
    ],
  );

  const pause = useCallback(async () => {
    playbackIntentRef.current = false;
    sessionCoordinatorRef.current.pauseActive();
    audioRef.current = sessionCoordinatorRef.current.getActiveHandle();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [audioRef, isPlayingRef, playbackIntentRef, sessionCoordinatorRef, setIsPlaying]);

  const resume = useCallback(async () => {
    playbackIntentRef.current = true;
    const activeHandle = sessionCoordinatorRef.current.getActiveHandle();
    if (activeHandle) {
      activeHandle.play();
      audioRef.current = activeHandle;
      isPlayingRef.current = true;
      setIsPlaying(true);
      return;
    }

    const track = currentTrackRef.current;
    if (track && !isLoadingRef.current) {
      await loadAndPlay(track);
    }
  }, [
    audioRef,
    currentTrackRef,
    isLoadingRef,
    isPlayingRef,
    loadAndPlay,
    playbackIntentRef,
    sessionCoordinatorRef,
    setIsPlaying,
  ]);

  const togglePlayPause = useCallback(async () => {
    const activeHandle = sessionCoordinatorRef.current.getActiveHandle();
    const currentlyPlaying = activeHandle ? activeHandle.getIsPlaying() : isPlayingRef.current;
    if (currentlyPlaying) {
      await pause();
    } else {
      await resume();
    }
  }, [isPlayingRef, pause, resume, sessionCoordinatorRef]);

  const next = useCallback(async () => {
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;
    const nextIdx = resolveNextQueueIndex(activeQueue.length, idx, repeatModeRef.current);
    if (nextIdx === null) return;
    queueIndexRef.current = nextIdx;
    setQueueIndex(nextIdx);
    await loadAndPlay(activeQueue[nextIdx]);
  }, [getActiveQueue, loadAndPlay, queueIndexRef, repeatModeRef, setQueueIndex]);

  const previous = useCallback(async () => {
    const activeHandle = sessionCoordinatorRef.current.getActiveHandle();
    if (positionRef.current > 3000 && activeHandle) {
      activeHandle.seekTo(0);
      emitPosition(0, true);
      return;
    }

    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;
    const prevIdx = resolvePreviousQueueIndex(activeQueue.length, idx, repeatModeRef.current);
    if (prevIdx !== null) {
      queueIndexRef.current = prevIdx;
      setQueueIndex(prevIdx);
      await loadAndPlay(activeQueue[prevIdx]);
    } else if (activeHandle) {
      activeHandle.seekTo(0);
      emitPosition(0, true);
    }
  }, [
    emitPosition,
    getActiveQueue,
    loadAndPlay,
    positionRef,
    queueIndexRef,
    repeatModeRef,
    sessionCoordinatorRef,
    setQueueIndex,
  ]);

  const seekTo = useCallback(
    async (pos: number) => {
      const nextPos = Math.max(0, pos);
      const activeHandle = sessionCoordinatorRef.current.getActiveHandle();
      if (activeHandle) {
        activeHandle.seekTo(nextPos / 1000);
      }
      emitPosition(nextPos, true);
    },
    [emitPosition, sessionCoordinatorRef],
  );

  const retryPlay = useCallback(async () => {
    const track = currentTrackRef.current;
    if (track) {
      playbackIntentRef.current = true;
      await loadAndPlay(track);
    }
  }, [currentTrackRef, loadAndPlay, playbackIntentRef]);

  const playRandom = useCallback(async () => {
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;
    const randomIdx = resolveRandomQueueIndex(activeQueue.length, idx);
    if (randomIdx === null) return;
    queueIndexRef.current = randomIdx;
    setQueueIndex(randomIdx);
    await loadAndPlay(activeQueue[randomIdx]);
  }, [getActiveQueue, loadAndPlay, queueIndexRef, setQueueIndex]);

  return {
    playTrack,
    pause,
    resume,
    togglePlayPause,
    next,
    previous,
    seekTo,
    retryPlay,
    playRandom,
  };
}
