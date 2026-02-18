import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { Song } from '@/lib/api/types';
import { useAuth } from '@/lib/contexts/AuthContext';

type RepeatMode = 'off' | 'one' | 'all';

interface PlayerContextValue {
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  duration: number;
  position: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
  playTrack: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  moveInQueue: (from: number, to: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { client } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const hasScrobbledRef = useRef(false);
  const isShuffledRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>('off');
  const queueRef = useRef<Song[]>([]);
  const shuffledQueueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }, []);

  const getActiveQueue = useCallback(() => {
    return isShuffledRef.current ? shuffledQueueRef.current : queueRef.current;
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 0);
    setIsPlaying(status.isPlaying);

    if (status.durationMillis && status.positionMillis > status.durationMillis * 0.5 && !hasScrobbledRef.current) {
      hasScrobbledRef.current = true;
      const track = soundRef.current ? currentTrackRef.current : null;
      if (track && client) {
        client.scrobble(track.id).catch(() => {});
      }
    }

    if (status.didJustFinish) {
      handleTrackEnd();
    }
  }, [client]);

  const currentTrackRef = useRef<Song | null>(null);
  currentTrackRef.current = currentTrack;

  const handleTrackEnd = useCallback(async () => {
    const mode = repeatModeRef.current;
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;

    if (mode === 'one') {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
      return;
    }

    if (idx < activeQueue.length - 1) {
      const nextIdx = idx + 1;
      const nextTrack = activeQueue[nextIdx];
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      await loadAndPlay(nextTrack);
    } else if (mode === 'all' && activeQueue.length > 0) {
      queueIndexRef.current = 0;
      setQueueIndex(0);
      await loadAndPlay(activeQueue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [getActiveQueue]);

  const loadAndPlay = useCallback(async (song: Song) => {
    if (!client) return;

    setIsLoading(true);
    hasScrobbledRef.current = false;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const streamUrl = client.getStreamUrl(song.id);
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );

      soundRef.current = sound;
      setCurrentTrack(song);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [client, onPlaybackStatusUpdate]);

  const playTrack = useCallback(async (song: Song, newQueue?: Song[], index?: number) => {
    if (newQueue) {
      queueRef.current = newQueue;
      setQueue(newQueue);
      const idx = index ?? newQueue.findIndex(s => s.id === song.id);
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
      const existingIdx = activeQueue.findIndex(s => s.id === song.id);
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
  }, [loadAndPlay, getActiveQueue]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const next = useCallback(async () => {
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;

    if (idx < activeQueue.length - 1) {
      const nextIdx = idx + 1;
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      await loadAndPlay(activeQueue[nextIdx]);
    } else if (repeatModeRef.current === 'all' && activeQueue.length > 0) {
      queueIndexRef.current = 0;
      setQueueIndex(0);
      await loadAndPlay(activeQueue[0]);
    }
  }, [getActiveQueue, loadAndPlay]);

  const previous = useCallback(async () => {
    if (position > 3000 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }

    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;

    if (idx > 0) {
      const prevIdx = idx - 1;
      queueIndexRef.current = prevIdx;
      setQueueIndex(prevIdx);
      await loadAndPlay(activeQueue[prevIdx]);
    } else if (repeatModeRef.current === 'all' && activeQueue.length > 0) {
      const lastIdx = activeQueue.length - 1;
      queueIndexRef.current = lastIdx;
      setQueueIndex(lastIdx);
      await loadAndPlay(activeQueue[lastIdx]);
    } else if (soundRef.current) {
      await soundRef.current.setPositionAsync(0);
    }
  }, [position, getActiveQueue, loadAndPlay]);

  const seekTo = useCallback(async (pos: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(pos);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    const newShuffled = !isShuffledRef.current;
    isShuffledRef.current = newShuffled;
    setIsShuffled(newShuffled);

    if (newShuffled) {
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
        const originalIdx = queueRef.current.findIndex(s => s.id === currentSong.id);
        if (originalIdx >= 0) {
          queueIndexRef.current = originalIdx;
          setQueueIndex(originalIdx);
        }
      }
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(repeatModeRef.current);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    repeatModeRef.current = nextMode;
    setRepeatMode(nextMode);
  }, []);

  const addToQueue = useCallback((song: Song) => {
    queueRef.current = [...queueRef.current, song];
    setQueue(prev => [...prev, song]);
    if (isShuffledRef.current) {
      shuffledQueueRef.current = [...shuffledQueueRef.current, song];
      setShuffledQueue(prev => [...prev, song]);
    }
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    const activeQueue = getActiveQueue();
    if (index < 0 || index >= activeQueue.length) return;

    if (isShuffledRef.current) {
      const removedSong = shuffledQueueRef.current[index];
      shuffledQueueRef.current = shuffledQueueRef.current.filter((_, i) => i !== index);
      setShuffledQueue(shuffledQueueRef.current);
      queueRef.current = queueRef.current.filter(s => s.id !== removedSong.id);
      setQueue(queueRef.current);
    } else {
      queueRef.current = queueRef.current.filter((_, i) => i !== index);
      setQueue(queueRef.current);
    }

    if (index < queueIndexRef.current) {
      queueIndexRef.current -= 1;
      setQueueIndex(queueIndexRef.current);
    }
  }, [getActiveQueue]);

  const clearQueue = useCallback(() => {
    queueRef.current = currentTrackRef.current ? [currentTrackRef.current] : [];
    setQueue(queueRef.current);
    shuffledQueueRef.current = queueRef.current;
    setShuffledQueue(queueRef.current);
    queueIndexRef.current = 0;
    setQueueIndex(0);
  }, []);

  const moveInQueue = useCallback((from: number, to: number) => {
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
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const value = useMemo(() => ({
    currentTrack,
    queue: isShuffled ? shuffledQueue : queue,
    queueIndex,
    isPlaying,
    duration,
    position,
    isShuffled,
    repeatMode,
    isLoading,
    playTrack,
    pause,
    resume,
    next,
    previous,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,
  }), [
    currentTrack, queue, shuffledQueue, queueIndex, isPlaying, duration, position,
    isShuffled, repeatMode, isLoading, playTrack, pause, resume, next, previous,
    seekTo, toggleShuffle, toggleRepeat, addToQueue, removeFromQueue, clearQueue, moveInQueue,
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
