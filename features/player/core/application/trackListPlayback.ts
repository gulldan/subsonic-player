import * as Haptics from 'expo-haptics';
import { resolveRandomQueueIndex } from '@/features/player/core/domain/playback';
import type { Song } from '@/shared/api/subsonic/types';

export type TrackListPlayer = {
  currentTrack: Song | null;
  isShuffled: boolean;
  playTrack: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  toggleShuffle: () => void;
};

type MediumImpactHaptics = Pick<typeof Haptics, 'impactAsync' | 'ImpactFeedbackStyle'>;

function resolveTrackIndex(queue: Song[], song: Song): number {
  const index = queue.findIndex((item) => item.id === song.id);
  return index >= 0 ? index : 0;
}

async function impactMedium(haptics: MediumImpactHaptics = Haptics): Promise<void> {
  try {
    await haptics.impactAsync(haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export async function playOrToggleTrack(player: TrackListPlayer, queue: Song[], song: Song): Promise<void> {
  if (player.currentTrack?.id === song.id) {
    await player.togglePlayPause();
    return;
  }

  await player.playTrack(song, queue, resolveTrackIndex(queue, song));
}

export function createTrackPressHandler(player: TrackListPlayer, queue: Song[]): (song: Song) => void {
  return (song: Song) => {
    void playOrToggleTrack(player, queue, song);
  };
}

export async function playAllFromQueue(
  player: TrackListPlayer,
  queue: Song[],
  haptics?: MediumImpactHaptics,
): Promise<void> {
  const first = queue[0];
  if (!first) return;

  await impactMedium(haptics);
  await player.playTrack(first, queue, 0);
}

export function createPlayAllHandler(player: TrackListPlayer, queue: Song[]): () => Promise<void> {
  return async () => {
    await playAllFromQueue(player, queue);
  };
}

export async function shuffleAndPlayFromQueue(
  player: TrackListPlayer,
  queue: Song[],
  haptics?: MediumImpactHaptics,
  random: () => number = Math.random,
): Promise<void> {
  const randomIndex = resolveRandomQueueIndex(queue.length, undefined, random);
  if (randomIndex === null) return;
  const selectedTrack = queue[randomIndex];
  if (!selectedTrack) return;

  await impactMedium(haptics);
  if (!player.isShuffled) {
    player.toggleShuffle();
  }

  await player.playTrack(selectedTrack, queue, randomIndex);
}

export function createShufflePlayHandler(player: TrackListPlayer, queue: Song[]): () => Promise<void> {
  return async () => {
    await shuffleAndPlayFromQueue(player, queue);
  };
}
