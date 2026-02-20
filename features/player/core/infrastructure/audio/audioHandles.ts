import { type AudioStatus, createAudioPlayer } from 'expo-audio';
import type { AudioHandle } from '@/features/player/core/domain/types';

export function createWebAudio(uri: string, onEnded: () => void): AudioHandle {
  const audio = new window.Audio(uri);
  audio.addEventListener('ended', onEnded);

  return {
    play: () => {
      audio.play().catch(() => {});
    },
    pause: () => {
      audio.pause();
    },
    seekTo: (seconds: number) => {
      audio.currentTime = seconds;
    },
    destroy: () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.src = '';
    },
    getCurrentTime: () => audio.currentTime,
    getDuration: () => (Number.isNaN(audio.duration) ? 0 : audio.duration),
    getIsPlaying: () => !audio.paused && !audio.ended,
  };
}

export function createNativeAudio(
  uri: string,
  onStatus: (status: AudioStatus) => void,
  shouldAutoPlay: () => boolean,
): AudioHandle {
  const player = createAudioPlayer(uri, { updateInterval: 200 });
  let started = false;

  const subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (!started && status.isLoaded) {
      started = true;
      if (shouldAutoPlay()) {
        player.play();
      }
    }
    onStatus(status);
  });

  return {
    play: () => {
      player.play();
    },
    pause: () => {
      player.pause();
    },
    seekTo: (seconds: number) => {
      player.seekTo(seconds).catch(() => {});
    },
    destroy: () => {
      subscription.remove();
      player.remove();
    },
    getCurrentTime: () => player.currentTime,
    getDuration: () => player.duration,
    getIsPlaying: () => player.playing,
  };
}
