import { router } from 'expo-router';
import type { Album, Artist } from '@/shared/api/subsonic/types';

type AlbumRouteParam = Pick<Album, 'id'>;
type ArtistRouteParam = Pick<Artist, 'id'>;

export function openAlbum(album: AlbumRouteParam): void {
  router.push(`/album/${album.id}`);
}

export function openArtist(artist: ArtistRouteParam): void {
  router.push(`/artist/${artist.id}`);
}
