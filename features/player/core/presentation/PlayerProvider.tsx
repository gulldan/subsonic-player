import { setAudioModeAsync } from 'expo-audio';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { AudioSessionCoordinator } from '@/features/player/core/application/session/AudioSessionCoordinator';
import { usePlayerLoader } from '@/features/player/core/application/usePlayerLoader';
import { usePlayerNotification } from '@/features/player/core/application/usePlayerNotification';
import { usePlayerQueueActions } from '@/features/player/core/application/usePlayerQueueActions';
import { usePlayerTransportActions } from '@/features/player/core/application/usePlayerTransportActions';
import { usePositionStore } from '@/features/player/core/application/usePositionStore';
import { IS_WEB } from '@/features/player/core/domain/constants';
import type { AudioHandle, PlayerContextValue, PositionStore, RepeatMode } from '@/features/player/core/domain/types';
import type { Song } from '@/shared/api/subsonic/types';

const PlayerContext = createContext<PlayerContextValue | null>(null);
const PositionStoreContext = createContext<PositionStore | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { client } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const audioRef = useRef<AudioHandle | null>(null);
  const sessionCoordinatorRef = useRef(new AudioSessionCoordinator<AudioHandle>());
  const hasScrobbledRef = useRef(false);
  const isShuffledRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>('off');
  const queueRef = useRef<Song[]>([]);
  const shuffledQueueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);
  const currentTrackRef = useRef<Song | null>(null);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);
  const playbackIntentRef = useRef(true);
  const isLoadingRef = useRef(false);
  const loadIdRef = useRef(0);
  const trackEndedRef = useRef(false);
  const loadAndPlayRef = useRef<(song: Song) => Promise<void>>(async () => {});

  const { positionRef, positionStore, emitPosition } = usePositionStore();
  currentTrackRef.current = currentTrack;

  useEffect(() => {
    if (!IS_WEB) {
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    }
  }, []);

  const { getActiveQueue, toggleShuffle, toggleRepeat, addToQueue, removeFromQueue, clearQueue, moveInQueue } =
    usePlayerQueueActions({
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
    });

  const loadAndPlay = usePlayerLoader({
    client,
    emitPosition,
    getActiveQueue,
    sessionCoordinatorRef,
    audioRef,
    hasScrobbledRef,
    repeatModeRef,
    queueIndexRef,
    currentTrackRef,
    durationRef,
    isPlayingRef,
    playbackIntentRef,
    isLoadingRef,
    loadIdRef,
    trackEndedRef,
    loadAndPlayRef,
    setCurrentTrack,
    setQueueIndex,
    setIsPlaying,
    setDuration,
    setIsLoading,
    setLoadError,
  });

  const { playTrack, pause, resume, togglePlayPause, next, previous, seekTo, retryPlay, playRandom } =
    usePlayerTransportActions({
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
    });

  usePlayerNotification(currentTrack, isPlaying);

  useEffect(() => {
    return () => {
      sessionCoordinatorRef.current.dispose();
      audioRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      currentTrack,
      queue: isShuffled ? shuffledQueue : queue,
      queueIndex,
      isPlaying,
      duration,
      isShuffled,
      repeatMode,
      isLoading,
      loadError,
      playTrack,
      togglePlayPause,
      pause,
      resume,
      next,
      previous,
      seekTo,
      playRandom,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      removeFromQueue,
      clearQueue,
      moveInQueue,
      retryPlay,
    }),
    [
      addToQueue,
      clearQueue,
      currentTrack,
      duration,
      isLoading,
      isPlaying,
      isShuffled,
      loadError,
      moveInQueue,
      next,
      pause,
      playTrack,
      playRandom,
      previous,
      queue,
      queueIndex,
      removeFromQueue,
      repeatMode,
      resume,
      retryPlay,
      seekTo,
      shuffledQueue,
      togglePlayPause,
      toggleRepeat,
      toggleShuffle,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      <PositionStoreContext.Provider value={positionStore}>{children}</PositionStoreContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

export function usePlayerPosition(): number {
  const store = useContext(PositionStoreContext);
  if (!store) throw new Error('usePlayerPosition must be used within PlayerProvider');
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
