import { useCallback } from 'react';
import { cycleRepeatMode } from '@/features/player/core/domain/playback';
import { shuffleArray } from '@/features/player/core/domain/queue';
import type { RepeatMode } from '@/features/player/core/domain/types';
import type { Song } from '@/shared/api/subsonic/types';

type RefObject<T> = { current: T };
type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

interface UsePlayerQueueActionsArgs {
  isShuffledRef: RefObject<boolean>;
  repeatModeRef: RefObject<RepeatMode>;
  queueRef: RefObject<Song[]>;
  shuffledQueueRef: RefObject<Song[]>;
  queueIndexRef: RefObject<number>;
  currentTrackRef: RefObject<Song | null>;
  setQueue: StateSetter<Song[]>;
  setShuffledQueue: StateSetter<Song[]>;
  setQueueIndex: StateSetter<number>;
  setIsShuffled: StateSetter<boolean>;
  setRepeatMode: StateSetter<RepeatMode>;
}

export function usePlayerQueueActions({
  isShuffledRef,
  repeatModeRef,
  queueRef,
  shuffledQueueRef,
  queueIndexRef,
  currentTrackRef,
  setQueue,
  setShuffledQueue,
  setQueueIndex,
  setIsShuffled,
  setRepeatMode,
}: UsePlayerQueueActionsArgs) {
  const getActiveQueue = useCallback(() => {
    return isShuffledRef.current ? shuffledQueueRef.current : queueRef.current;
  }, [isShuffledRef, shuffledQueueRef, queueRef]);

  const toggleShuffle = useCallback(() => {
    const nextShuffled = !isShuffledRef.current;
    isShuffledRef.current = nextShuffled;
    setIsShuffled(nextShuffled);

    if (nextShuffled) {
      const current = queueRef.current[queueIndexRef.current];
      const others = queueRef.current.filter((_, i) => i !== queueIndexRef.current);
      const shuffled = current ? [current, ...shuffleArray(others)] : shuffleArray(queueRef.current);
      shuffledQueueRef.current = shuffled;
      setShuffledQueue(shuffled);
      queueIndexRef.current = 0;
      setQueueIndex(0);
    } else {
      const currentSong = currentTrackRef.current;
      if (currentSong) {
        const originalIdx = queueRef.current.findIndex((song) => song.id === currentSong.id);
        if (originalIdx >= 0) {
          queueIndexRef.current = originalIdx;
          setQueueIndex(originalIdx);
        }
      }
    }
  }, [
    currentTrackRef,
    isShuffledRef,
    queueIndexRef,
    queueRef,
    setIsShuffled,
    setQueueIndex,
    setShuffledQueue,
    shuffledQueueRef,
  ]);

  const toggleRepeat = useCallback(() => {
    const nextMode = cycleRepeatMode(repeatModeRef.current);
    repeatModeRef.current = nextMode;
    setRepeatMode(nextMode);
  }, [repeatModeRef, setRepeatMode]);

  const addToQueue = useCallback(
    (song: Song) => {
      queueRef.current = [...queueRef.current, song];
      setQueue((prev) => [...prev, song]);
      if (isShuffledRef.current) {
        shuffledQueueRef.current = [...shuffledQueueRef.current, song];
        setShuffledQueue((prev) => [...prev, song]);
      }
    },
    [isShuffledRef, queueRef, setQueue, setShuffledQueue, shuffledQueueRef],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      const activeQueue = getActiveQueue();
      if (index < 0 || index >= activeQueue.length) return;

      if (isShuffledRef.current) {
        const removedSong = shuffledQueueRef.current[index];
        shuffledQueueRef.current = shuffledQueueRef.current.filter((_, i) => i !== index);
        setShuffledQueue(shuffledQueueRef.current);
        queueRef.current = queueRef.current.filter((song) => song.id !== removedSong.id);
        setQueue(queueRef.current);
      } else {
        queueRef.current = queueRef.current.filter((_, i) => i !== index);
        setQueue(queueRef.current);
      }

      if (index < queueIndexRef.current) {
        queueIndexRef.current -= 1;
        setQueueIndex(queueIndexRef.current);
      }
    },
    [
      getActiveQueue,
      isShuffledRef,
      queueIndexRef,
      queueRef,
      setQueue,
      setQueueIndex,
      setShuffledQueue,
      shuffledQueueRef,
    ],
  );

  const clearQueue = useCallback(() => {
    queueRef.current = currentTrackRef.current ? [currentTrackRef.current] : [];
    setQueue(queueRef.current);
    shuffledQueueRef.current = queueRef.current;
    setShuffledQueue(queueRef.current);
    queueIndexRef.current = 0;
    setQueueIndex(0);
  }, [currentTrackRef, queueIndexRef, queueRef, setQueue, setQueueIndex, setShuffledQueue, shuffledQueueRef]);

  const moveInQueue = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const activeQueue = getActiveQueue();
      if (from < 0 || to < 0 || from >= activeQueue.length || to >= activeQueue.length) return;

      if (isShuffledRef.current) {
        const newQueue = [...shuffledQueueRef.current];
        const [moved] = newQueue.splice(from, 1);
        newQueue.splice(to, 0, moved);
        shuffledQueueRef.current = newQueue;
        setShuffledQueue(newQueue);
      } else {
        const newQueue = [...queueRef.current];
        const [moved] = newQueue.splice(from, 1);
        newQueue.splice(to, 0, moved);
        queueRef.current = newQueue;
        setQueue(newQueue);
      }

      if (queueIndexRef.current === from) {
        queueIndexRef.current = to;
        setQueueIndex(to);
      } else if (from < queueIndexRef.current && to >= queueIndexRef.current) {
        queueIndexRef.current -= 1;
        setQueueIndex(queueIndexRef.current);
      } else if (from > queueIndexRef.current && to <= queueIndexRef.current) {
        queueIndexRef.current += 1;
        setQueueIndex(queueIndexRef.current);
      }
    },
    [
      getActiveQueue,
      isShuffledRef,
      queueIndexRef,
      queueRef,
      setQueue,
      setQueueIndex,
      setShuffledQueue,
      shuffledQueueRef,
    ],
  );

  return {
    getActiveQueue,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,
  };
}
