import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { createTrackPressHandler } from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Album, Artist, SearchResult3 } from '@/shared/api/subsonic/types';
import { HORIZONTAL_LIST_PROPS, keyExtractorById } from '@/shared/components/lists/flatListProps';
import { AlbumCard, ArtistCard, EmptyState, SectionHeader, TrackList } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import { openAlbum, openArtist } from '@/shared/navigation/navigation';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_LG,
  SCREEN_PADDING_H,
  SCROLL_BOTTOM_INSET,
  SEARCH_INPUT_HEIGHT,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

const ARTIST_ITEM_MARGIN = { marginRight: Spacing.lg } as const;
const ALBUM_ITEM_MARGIN = { marginRight: Spacing.md } as const;
const SCROLL_CONTENT_STYLE = { paddingBottom: SCROLL_BOTTOM_INSET } as const;

export default function SearchScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult3 | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (!client) return;
      setIsSearching(true);
      try {
        const res = await client.search3(query.trim(), 5, 5, 10);
        setResults(res.searchResult3);
      } catch {
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, client]);

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);
  const artists = results?.artist ?? [];
  const albums = results?.album ?? [];
  const songs = results?.song ?? [];
  const hasResults = artists.length > 0 || albums.length > 0 || songs.length > 0;
  const handleSongPress = useMemo(() => createTrackPressHandler(player, songs), [player, songs]);

  const renderArtistItem = useCallback(
    ({ item }: { item: Artist }) => (
      <View style={ARTIST_ITEM_MARGIN}>
        <ArtistCard artist={item} onPress={openArtist} />
      </View>
    ),
    [],
  );

  const renderAlbumItem = useCallback(
    ({ item }: { item: Album }) => (
      <View style={ALBUM_ITEM_MARGIN}>
        <AlbumCard album={item} onPress={openAlbum} size={140} />
      </View>
    ),
    [],
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.searchHeader, { paddingTop: topPadding + HEADER_TOP_GAP_LG }]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={p.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.searchPlaceholder')}
            placeholderTextColor={p.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t('search.searchPlaceholder')}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={18} color={p.textTertiary} style={styles.clearIcon} />
            </Pressable>
          )}
        </View>
      </View>

      {!query.trim() ? (
        <EmptyState icon="search" message={t('search.searchPlaceholder')} />
      ) : !hasResults && !isSearching ? (
        <EmptyState icon="musical-notes" message={t('search.noResults')} />
      ) : (
        <ScrollView contentContainerStyle={SCROLL_CONTENT_STYLE} showsVerticalScrollIndicator={false}>
          {artists.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('search.artists')} />
              <FlatList
                data={artists}
                renderItem={renderArtistItem}
                keyExtractor={keyExtractorById}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                scrollEnabled={artists.length > 0}
                {...HORIZONTAL_LIST_PROPS}
              />
            </View>
          )}

          {albums.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('search.albums')} />
              <FlatList
                data={albums}
                renderItem={renderAlbumItem}
                keyExtractor={keyExtractorById}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                scrollEnabled={albums.length > 0}
                {...HORIZONTAL_LIST_PROPS}
              />
            </View>
          )}

          {songs.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('search.songs')} />
              <TrackList songs={songs} onPress={handleSongPress} showArt isActiveTrackId={player.currentTrack?.id} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.black,
  },
  searchHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: SEARCH_INPUT_HEIGHT,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: p.textPrimary,
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_400Regular',
  },
  clearIcon: {
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  horizontalList: {
    paddingHorizontal: SCREEN_PADDING_H,
  },
});
