import type { Album } from '@/shared/api/subsonic/types';
import { AlbumCard } from '@/shared/components/media/ui';

type AlbumRenderItem = {
  item: Album;
};

export function createAlbumCardRenderItem(onPress: (album: Album) => void, size: number) {
  return ({ item }: AlbumRenderItem) => <AlbumCard album={item} onPress={onPress} size={size} />;
}
