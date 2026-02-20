import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlbumCard, CoverArt, EmptyState, SectionHeader, TrackItem } from '@/components/ui';
import Colors from '@/constants/colors';
import type { Album, Artist, Song } from '@/lib/api/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useI18n } from '@/lib/i18n';

const p = Colors.palette;

export default function StarredScreen() {
  const { client } = useAuth();
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading } = useQuery({
    queryKey: ['starred'],
    queryFn: () => client!.getStarred2(),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;

  const starred = data?.starred2;
  const artists = starred?.artist ?? [];
  const albums = starred?.album ?? [];
  const songs = starred?.song ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const isEmpty = artists.length === 0 && albums.length === 0 && songs.length === 0;

  const handleAlbumPress = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const handleArtistPress = (artist: Artist) => {
    router.push(`/artist/${artist.id}`);
  };

  const handleTrackPress = (song: Song) => {
    const idx = songs.findIndex((s) => s.id === song.id);
    player.playTrack(song, songs, idx >= 0 ? idx : 0);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.starred')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isEmpty ? (
        <EmptyState icon="star-outline" message={t('common.noResults')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {artists.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('search.artists')} />
              <FlatList
                data={artists}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleArtistPress(item)}
                    style={({ pressed }) => [{ alignItems: 'center', width: 90 }, pressed && { opacity: 0.7 }]}
                  >
                    <CoverArt coverArtId={item.coverArt} size={80} borderRadius={40} />
                    <Text style={styles.artistName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null}

          {albums.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('search.albums')} />
              <FlatList
                data={albums}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AlbumCard album={item} onPress={handleAlbumPress} size={150} />}
              />
            </View>
          ) : null}

          {songs.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('search.songs')} />
              {songs.map((song, i) => (
                <TrackItem
                  key={song.id}
                  song={song}
                  index={i + 1}
                  onPress={handleTrackPress}
                  showArt
                  isActive={player.currentTrack?.id === song.id}
                />
              ))}
            </View>
          ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 8,
    marginBottom: 20,
  },
  artistName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
});
