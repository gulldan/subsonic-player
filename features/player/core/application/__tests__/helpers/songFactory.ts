import type { Song } from '@/shared/api/subsonic/types';

export function createSong(id: string): Song {
  return {
    id,
    title: `Track ${id}`,
  };
}
