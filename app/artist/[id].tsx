import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useI18n } from '@/lib/i18n';
import { CoverArt, AlbumCard, TrackItem, SectionHeader } from '@/components/ui';
import Colors from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, ScrollView, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Album, Song } from '@/lib/api/types';

const p = Colors.palette;

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client } = useAuth();
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data: artistData, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => client!.getArtist(id as string),
    enabled: !!client && !!id,
  });

  const { data: artistInfo } = useQuery({
    queryKey: ['artistInfo', id],
    queryFn: () => client!.getArtistInfo2(id as string),
    enabled: !!client && !!id,
  });

  if (!fontsLoaded) return null;

  const artist = artistData?.artist;
  const albums = artist?.album ?? [];
  const bio = artistInfo?.artistInfo2?.biography;
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const topSongs: Song[] = [];
  for (const alb of albums) {
    if (alb.song) {
      for (const s of alb.song) {
        if (topSongs.length < 5) topSongs.push(s);
      }
    }
  }

  const handleAlbumPress = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const handleTrackPress = (song: Song) => {
    player.playTrack(song);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPadding + 8 }]}
      >
        <Ionicons name="chevron-back" size={28} color={p.white} />
      </Pressable>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : artist ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.artWrap}>
            <CoverArt coverArtId={artist.coverArt} size={160} borderRadius={80} />
          </View>

          <Text style={styles.artistTitle}>{artist.name}</Text>
          <Text style={styles.albumCountText}>
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </Text>

          {bio ? (
            <Text style={styles.bioText} numberOfLines={4}>{bio.replace(/<[^>]*>/g, '')}</Text>
          ) : null}

          {albums.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Albums" />
              <FlatList
                data={albums}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <AlbumCard album={item} onPress={handleAlbumPress} size={150} />
                )}
              />
            </View>
          ) : null}

          {topSongs.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Top Songs" />
              {topSongs.map((song, i) => (
                <TrackItem
                  key={song.id}
                  song={song}
                  index={i + 1}
                  onPress={handleTrackPress}
                  isActive={player.currentTrack?.id === song.id}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.black,
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  artistTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  albumCountText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
});
