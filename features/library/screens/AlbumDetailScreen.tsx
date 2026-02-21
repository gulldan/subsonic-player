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
import { useMemo } from 'react';
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
import { createDetailContentStyle } from '@/shared/components/lists/flatListProps';
import { CoverArt, EmptyState, formatDuration, TrackList } from '@/shared/components/media/ui';
import Colors from '@/shared/theme/colors';
import {
  DETAIL_ART_MARGIN,
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_RADIUS,
  ICON_BUTTON_SIZE,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client } = useAuth();
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['album', id],
    queryFn: () => client!.getAlbum(id as string),
    enabled: !!client && !!id,
  });

  const album = data?.album;
  const songs = album?.song ?? [];

  const handlePlayAll = useMemo(() => createPlayAllHandler(player, songs), [player, songs]);
  const handleShuffle = useMemo(() => createShufflePlayHandler(player, songs), [player, songs]);
  const handleTrackPress = useMemo(() => createTrackPressHandler(player, songs), [player, songs]);

  const artSize = width - DETAIL_ART_MARGIN * 2;
  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const contentContainerStyle = useMemo(
    () => createDetailContentStyle(topPadding, insets.bottom),
    [topPadding, insets.bottom],
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPadding + HEADER_TOP_GAP_SM }]}
        hitSlop={2}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={28} color={p.white} />
      </Pressable>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError || (!album && !isLoading) ? (
        <EmptyState icon="alert-circle-outline" message="Failed to load album" />
      ) : album ? (
        <ScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          <View style={styles.artWrap}>
            <CoverArt coverArtId={album.coverArt} size={artSize} borderRadius={16} />
          </View>

          <View style={styles.info}>
            <Text style={styles.albumTitle}>{album.name}</Text>

            {album.artist ? (
              <Pressable
                onPress={() => album.artistId && router.push(`/artist/${album.artistId}`)}
                accessibilityLabel={album.artist}
                accessibilityRole="button"
              >
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
              <Pressable
                onPress={handlePlayAll}
                style={styles.playAllBtn}
                accessibilityLabel="Play all"
                accessibilityRole="button"
              >
                <Ionicons name="play" size={20} color={p.black} />
                <Text style={styles.playAllText}>Play All</Text>
              </Pressable>
              <Pressable
                onPress={handleShuffle}
                style={styles.shuffleBtn}
                accessibilityLabel="Shuffle"
                accessibilityRole="button"
              >
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
    left: Spacing.md,
    zIndex: 10,
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_RADIUS,
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing['4xl'],
  },
  info: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  albumTitle: {
    fontSize: FontSize.headline,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: Spacing.xs,
  },
  artistName: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_500Medium',
    color: p.accent,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metaText: {
    fontSize: FontSize.body2,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: p.accent,
    borderRadius: 12,
  },
  playAllText: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_600SemiBold',
    color: p.black,
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: p.accent,
  },
  shuffleText: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_600SemiBold',
    color: p.accent,
  },
});
