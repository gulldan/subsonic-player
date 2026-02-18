import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
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

const IS_WEB = Platform.OS === 'web';

interface AudioHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
}

function createWebAudio(uri: string, onEnded: () => void): AudioHandle {
  const audio = new window.Audio(uri);
  audio.addEventListener('ended', onEnded);

  return {
    play: () => { audio.play().catch(() => {}); },
    pause: () => { audio.pause(); },
    seekTo: (s) => { audio.currentTime = s; },
    destroy: () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.src = '';
    },
    getCurrentTime: () => audio.currentTime,
    getDuration: () => (isNaN(audio.duration) ? 0 : audio.duration),
    getIsPlaying: () => !audio.paused && !audio.ended,
  };
}

async function createNativeAudio(
  uri: string,
  onStatus: (status: AVPlaybackStatus) => void
): Promise<AudioHandle> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
    onStatus
  );

  return {
    play: () => { sound.playAsync().catch(() => {}); },
    pause: () => { sound.pauseAsync().catch(() => {}); },
    seekTo: (s) => { sound.setPositionAsync(s * 1000).catch(() => {}); },
    destroy: () => { sound.unloadAsync().catch(() => {}); },
    getCurrentTime: () => 0,
    getDuration: () => 0,
    getIsPlaying: () => false,
  };
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

  const audioRef = useRef<AudioHandle | null>(null);
  const hasScrobbledRef = useRef(false);
  const isShuffledRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>('off');
  const queueRef = useRef<Song[]>([]);
  const shuffledQueueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);
  const currentTrackRef = useRef<Song | null>(null);
  const isLoadingRef = useRef(false);
  const loadIdRef = useRef(0);
  const trackEndedRef = useRef(false);

  currentTrackRef.current = currentTrack;

  useEffect(() => {
    if (!IS_WEB) {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    }
  }, []);

  const getActiveQueue = useCallback(() => {
    return isShuffledRef.current ? shuffledQueueRef.current : queueRef.current;
  }, []);

  const handleTrackEnd = useCallback(async () => {
    if (trackEndedRef.current) return;
    trackEndedRef.current = true;

    const mode = repeatModeRef.current;
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;

    if (mode === 'one') {
      if (audioRef.current) {
        audioRef.current.seekTo(0);
        audioRef.current.play();
      }
      trackEndedRef.current = false;
      return;
    }

    if (idx < activeQueue.length - 1) {
      const nextIdx = idx + 1;
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      await loadAndPlay(activeQueue[nextIdx]);
    } else if (mode === 'all' && activeQueue.length > 0) {
      queueIndexRef.current = 0;
      setQueueIndex(0);
      await loadAndPlay(activeQueue[0]);
    } else {
      setIsPlaying(false);
    }
    trackEndedRef.current = false;
  }, [getActiveQueue]);

  const loadAndPlay = useCallback(async (song: Song) => {
    if (!client) return;

    if (audioRef.current) {
      try { audioRef.current.destroy(); } catch {}
      audioRef.current = null;
    }

    isLoadingRef.current = true;
    const thisLoadId = ++loadIdRef.current;

    setIsLoading(true);
    hasScrobbledRef.current = false;

    try {
      if (thisLoadId !== loadIdRef.current) return;

      const streamUrl = client.getStreamUrl(song.id);

      let handle: AudioHandle;

      if (IS_WEB) {
        handle = createWebAudio(streamUrl, () => handleTrackEnd());
        handle.play();
      } else {
        handle = await createNativeAudio(streamUrl, (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setPosition(status.positionMillis);
          setDuration(status.durationMillis ?? 0);
          setIsPlaying(status.isPlaying);

          if (
            status.durationMillis &&
            status.positionMillis > status.durationMillis * 0.5 &&
            !hasScrobbledRef.current
          ) {
            hasScrobbledRef.current = true;
            const track = currentTrackRef.current;
            if (track && client) {
              client.scrobble(track.id).catch(() => {});
            }
          }

          if (status.didJustFinish) {
            handleTrackEnd();
          }
        });
      }

      if (thisLoadId !== loadIdRef.current) {
        handle.destroy();
        return;
      }

      audioRef.current = handle;
      setCurrentTrack(song);
      setIsPlaying(true);
    } catch (e) {
      console.warn('loadAndPlay error:', e);
      setIsPlaying(false);
    } finally {
      if (thisLoadId === loadIdRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [client, handleTrackEnd]);

  useEffect(() => {
    if (!IS_WEB) return;

    const interval = setInterval(() => {
      const handle = audioRef.current;
      if (!handle) return;

      const currentTime = handle.getCurrentTime();
      const dur = handle.getDuration();
      const playing = handle.getIsPlaying();

      setPosition(currentTime * 1000);
      setDuration(dur * 1000);
      setIsPlaying(playing);

      if (dur > 0 && currentTime > dur * 0.5 && !hasScrobbledRef.current) {
        hasScrobbledRef.current = true;
        const track = currentTrackRef.current;
        if (track && client) {
          client.scrobble(track.id).catch(() => {});
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [client]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.play();
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
    if (position > 3000 && audioRef.current) {
      audioRef.current.seekTo(0);
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
    } else if (audioRef.current) {
      audioRef.current.seekTo(0);
    }
  }, [position, getActiveQueue, loadAndPlay]);

  const seekTo = useCallback(async (pos: number) => {
    if (audioRef.current) {
      audioRef.current.seekTo(pos / 1000);
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
      if (audioRef.current) {
        audioRef.current.destroy();
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
