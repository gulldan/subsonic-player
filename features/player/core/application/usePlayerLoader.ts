import type { AudioStatus } from 'expo-audio';
import { useCallback, useEffect } from 'react';
import { stopHandleSafely } from '@/features/player/core/application/session/AudioSessionCoordinator';
import { IS_WEB } from '@/features/player/core/domain/constants';
import { mapLoadError } from '@/features/player/core/domain/errors';
import { resolveNextQueueIndex } from '@/features/player/core/domain/playback';
import type { AudioHandle, RefObject, RepeatMode, StateSetter } from '@/features/player/core/domain/types';
import { createNativeAudio, createWebAudio } from '@/features/player/core/infrastructure/audio/audioHandles';
import type { SubsonicClient } from '@/shared/api/subsonic/subsonic';
import type { Song } from '@/shared/api/subsonic/types';

interface UsePlayerLoaderArgs {
  client: SubsonicClient | null;
  emitPosition: (positionMs: number, force?: boolean) => void;
  getActiveQueue: () => Song[];
  sessionCoordinatorRef: RefObject<{
    startNewSession: () => number;
    register: (sessionId: number, handle: AudioHandle) => boolean;
    isActive: (sessionId: number) => boolean;
    getActiveHandle: () => AudioHandle | null;
  }>;
  audioRef: RefObject<AudioHandle | null>;
  hasScrobbledRef: RefObject<boolean>;
  repeatModeRef: RefObject<RepeatMode>;
  queueIndexRef: RefObject<number>;
  currentTrackRef: RefObject<Song | null>;
  durationRef: RefObject<number>;
  isPlayingRef: RefObject<boolean>;
  playbackIntentRef: RefObject<boolean>;
  isLoadingRef: RefObject<boolean>;
  loadIdRef: RefObject<number>;
  trackEndedRef: RefObject<boolean>;
  loadAndPlayRef: RefObject<(song: Song) => Promise<void>>;
  setCurrentTrack: StateSetter<Song | null>;
  setQueueIndex: StateSetter<number>;
  setIsPlaying: StateSetter<boolean>;
  setDuration: StateSetter<number>;
  setIsLoading: StateSetter<boolean>;
  setLoadError: StateSetter<string | null>;
}

export function usePlayerLoader({
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
}: UsePlayerLoaderArgs) {
  const handleTrackEnd = useCallback(async (): Promise<void> => {
    if (trackEndedRef.current) return;
    trackEndedRef.current = true;

    const mode = repeatModeRef.current;
    const activeQueue = getActiveQueue();
    const idx = queueIndexRef.current;

    if (mode === 'one') {
      const activeHandle = sessionCoordinatorRef.current.getActiveHandle();
      if (activeHandle) {
        activeHandle.seekTo(0);
        activeHandle.play();
        emitPosition(0, true);
      }
      trackEndedRef.current = false;
      return;
    }

    const nextIdx = resolveNextQueueIndex(activeQueue.length, idx, mode);
    if (nextIdx !== null) {
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      await loadAndPlayRef.current(activeQueue[nextIdx]);
    } else {
      playbackIntentRef.current = false;
      isPlayingRef.current = false;
      setIsPlaying(false);
    }

    trackEndedRef.current = false;
  }, [
    emitPosition,
    getActiveQueue,
    isPlayingRef,
    loadAndPlayRef,
    playbackIntentRef,
    queueIndexRef,
    repeatModeRef,
    sessionCoordinatorRef,
    setIsPlaying,
    setQueueIndex,
    trackEndedRef,
  ]);

  const loadAndPlay = useCallback(
    async (song: Song) => {
      if (!client) return;

      const sessionId = sessionCoordinatorRef.current.startNewSession();
      audioRef.current = null;

      isLoadingRef.current = true;
      const thisLoadId = ++loadIdRef.current;

      setIsLoading(true);
      setLoadError(null);
      emitPosition(0, true);
      const nextDuration = song.duration ? song.duration * 1000 : 0;
      durationRef.current = nextDuration;
      setDuration(nextDuration);
      hasScrobbledRef.current = false;

      try {
        if (thisLoadId !== loadIdRef.current) return;

        const streamUrl = client.getStreamUrl(song.id);
        let handle: AudioHandle;

        if (IS_WEB) {
          handle = createWebAudio(streamUrl, () => {
            if (!sessionCoordinatorRef.current.isActive(sessionId)) return;
            void handleTrackEnd();
          });
          if (playbackIntentRef.current) {
            handle.play();
          }
        } else {
          handle = createNativeAudio(
            streamUrl,
            (status: AudioStatus) => {
              if (!sessionCoordinatorRef.current.isActive(sessionId)) return;
              if (!status.isLoaded) return;

              const posMs = status.currentTime * 1000;
              emitPosition(posMs);

              const newDur = status.duration * 1000;
              if (newDur !== durationRef.current) {
                durationRef.current = newDur;
                setDuration(newDur);
              }
              if (status.playing !== isPlayingRef.current) {
                isPlayingRef.current = status.playing;
                setIsPlaying(status.playing);
              }

              if (status.duration > 0 && status.currentTime > status.duration * 0.5 && !hasScrobbledRef.current) {
                hasScrobbledRef.current = true;
                const track = currentTrackRef.current;
                if (track) {
                  client.scrobble(track.id).catch(() => {});
                }
              }

              if (status.didJustFinish) {
                void handleTrackEnd();
              }
            },
            () => playbackIntentRef.current,
          );
        }

        if (thisLoadId !== loadIdRef.current || !sessionCoordinatorRef.current.isActive(sessionId)) {
          stopHandleSafely(handle);
          return;
        }

        const registered = sessionCoordinatorRef.current.register(sessionId, handle);
        if (!registered) return;

        audioRef.current = sessionCoordinatorRef.current.getActiveHandle();
        setCurrentTrack(song);

        const shouldPlay = playbackIntentRef.current;
        if (!shouldPlay) {
          handle.pause();
        }
        isPlayingRef.current = shouldPlay;
        setIsPlaying(shouldPlay);
      } catch (error) {
        console.warn('loadAndPlay error:', error);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setLoadError(mapLoadError(error));
      } finally {
        if (thisLoadId === loadIdRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [
      audioRef,
      client,
      currentTrackRef,
      durationRef,
      emitPosition,
      handleTrackEnd,
      hasScrobbledRef,
      isLoadingRef,
      isPlayingRef,
      loadIdRef,
      playbackIntentRef,
      sessionCoordinatorRef,
      setCurrentTrack,
      setDuration,
      setIsLoading,
      setIsPlaying,
      setLoadError,
    ],
  );

  loadAndPlayRef.current = loadAndPlay;

  useEffect(() => {
    if (!IS_WEB) return;

    const interval = setInterval(() => {
      const handle = sessionCoordinatorRef.current.getActiveHandle();
      if (!handle) return;
      audioRef.current = handle;

      const currentTime = handle.getCurrentTime();
      const handleDuration = handle.getDuration();
      const playing = handle.getIsPlaying();

      emitPosition(currentTime * 1000);

      const newDur = handleDuration * 1000;
      if (newDur !== durationRef.current) {
        durationRef.current = newDur;
        setDuration(newDur);
      }
      if (playing !== isPlayingRef.current) {
        isPlayingRef.current = playing;
        setIsPlaying(playing);
      }

      if (handleDuration > 0 && currentTime > handleDuration * 0.5 && !hasScrobbledRef.current) {
        hasScrobbledRef.current = true;
        const track = currentTrackRef.current;
        if (track && client) {
          client.scrobble(track.id).catch(() => {});
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    audioRef,
    client,
    currentTrackRef,
    durationRef,
    emitPosition,
    hasScrobbledRef,
    isPlayingRef,
    sessionCoordinatorRef,
    setDuration,
    setIsPlaying,
  ]);

  return loadAndPlay;
}
