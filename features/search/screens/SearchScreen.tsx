import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { openAlbum, openArtist } from '@/features/library/application/navigation';
import { createTrackPressHandler } from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { SearchResult3 } from '@/shared/api/subsonic/types';
import { AlbumCard, ArtistCard, EmptyState, SectionHeader, TrackList } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

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

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const artists = results?.artist ?? [];
  const albums = results?.album ?? [];
  const songs = results?.song ?? [];
  const hasResults = artists.length > 0 || albums.length > 0 || songs.length > 0;
  const handleSongPress = createTrackPressHandler(player, songs);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.searchHeader, { paddingTop: topPadding + 16 }]}>
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
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={p.textTertiary}
              onPress={() => setQuery('')}
              style={styles.clearIcon}
            />
          )}
        </View>
      </View>

      {!query.trim() ? (
        <EmptyState icon="search" message={t('search.searchPlaceholder')} />
      ) : !hasResults && !isSearching ? (
        <EmptyState icon="musical-notes" message={t('search.noResults')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {artists.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('search.artists')} />
              <FlatList
                data={artists}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 16 }}>
                    <ArtistCard artist={item} onPress={openArtist} />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                scrollEnabled={artists.length > 0}
              />
            </View>
          )}

          {albums.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('search.albums')} />
              <FlatList
                data={albums}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 12 }}>
                    <AlbumCard album={item} onPress={openAlbum} size={140} />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                scrollEnabled={albums.length > 0}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: p.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  clearIcon: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
});
