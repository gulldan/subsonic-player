import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  createPlayAllHandler,
  createShufflePlayHandler,
  createTrackPressHandler,
} from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import { CoverArt, formatDuration, TrackList } from '@/shared/components/media/ui';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client } = useAuth();
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => client!.getAlbum(id as string),
    enabled: !!client && !!id,
  });

  if (!fontsLoaded) return null;

  const album = data?.album;
  const songs = album?.song ?? [];
  const artSize = width - 80;
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const handlePlayAll = createPlayAllHandler(player, songs);
  const handleShuffle = createShufflePlayHandler(player, songs);
  const handleTrackPress = createTrackPressHandler(player, songs);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: topPadding + 8 }]}>
        <Ionicons name="chevron-back" size={28} color={p.white} />
      </Pressable>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : album ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.artWrap}>
            <CoverArt coverArtId={album.coverArt} size={artSize} borderRadius={16} />
          </View>

          <View style={styles.info}>
            <Text style={styles.albumTitle}>{album.name}</Text>

            {album.artist ? (
              <Pressable onPress={() => album.artistId && router.push(`/artist/${album.artistId}`)}>
                <Text style={styles.artistName}>{album.artist}</Text>
              </Pressable>
            ) : null}

            <View style={styles.metaRow}>
              {album.year ? <Text style={styles.metaText}>{album.year}</Text> : null}
              {album.genre ? <Text style={styles.metaText}>{album.genre}</Text> : null}
              <Text style={styles.metaText}>
                {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              </Text>
              {totalDuration > 0 ? <Text style={styles.metaText}>{formatDuration(totalDuration, true)}</Text> : null}
            </View>

            <View style={styles.buttonRow}>
              <Pressable onPress={handlePlayAll} style={styles.playAllBtn}>
                <Ionicons name="play" size={20} color={p.black} />
                <Text style={styles.playAllText}>Play All</Text>
              </Pressable>
              <Pressable onPress={handleShuffle} style={styles.shuffleBtn}>
                <Ionicons name="shuffle" size={20} color={p.accent} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </Pressable>
            </View>
          </View>

          <TrackList songs={songs} onPress={handleTrackPress} isActiveTrackId={player.currentTrack?.id} />
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
    backgroundColor: p.overlay,
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
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  info: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  albumTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.accent,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: p.accent,
    borderRadius: 12,
  },
  playAllText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: p.black,
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: p.accent,
  },
  shuffleText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: p.accent,
  },
});
