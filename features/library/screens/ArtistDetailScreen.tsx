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
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { openAlbum } from '@/features/library/application/navigation';
import { createTrackPressHandler } from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Song } from '@/shared/api/subsonic/types';
import {
  createDetailContentStyle,
  HORIZONTAL_LIST_PROPS,
  keyExtractorById,
} from '@/shared/components/lists/flatListProps';
import { createAlbumCardRenderItem } from '@/shared/components/media/renderers';
import { CoverArt, EmptyState, SectionHeader, TrackList } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_RADIUS,
  ICON_BUTTON_SIZE,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;
const ALBUM_LIST_CONTENT_STYLE = { paddingHorizontal: Spacing.xl, gap: Spacing.lg } as const;

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client } = useAuth();
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const {
    data: artistData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => client!.getArtist(id as string),
    enabled: !!client && !!id,
  });

  const artistName = artistData?.artist?.name;
  const { data: topSongsData } = useQuery({
    queryKey: ['topSongs', artistName],
    queryFn: () => client!.getTopSongs(artistName as string, 10),
    enabled: !!client && !!artistName,
  });

  const { data: artistInfo } = useQuery({
    queryKey: ['artistInfo', id],
    queryFn: () => client!.getArtistInfo2(id as string),
    enabled: !!client && !!id,
  });

  const artist = artistData?.artist;
  const albums = artist?.album ?? [];
  const bio = artistInfo?.artistInfo2?.biography;

  const fallbackTopSongs: Song[] = [];
  for (const alb of albums) {
    if (alb.song) {
      for (const s of alb.song) {
        if (fallbackTopSongs.length < 10) fallbackTopSongs.push(s);
      }
    }
  }
  const topSongs = topSongsData?.topSongs?.song?.length ? topSongsData.topSongs.song : fallbackTopSongs;
  const handleTrackPress = useMemo(() => createTrackPressHandler(player, topSongs), [player, topSongs]);
  const renderAlbumRailItem = useMemo(() => createAlbumCardRenderItem(openAlbum, 150), []);

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);
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
      ) : isError || (!artist && !isLoading) ? (
        <EmptyState icon="alert-circle-outline" message="Failed to load artist" />
      ) : artist ? (
        <ScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          <View style={styles.artWrap}>
            <CoverArt coverArtId={artist.coverArt} size={160} borderRadius={80} />
          </View>

          <Text style={styles.artistTitle}>{artist.name}</Text>
          <Text style={styles.albumCountText}>
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </Text>

          {bio ? (
            <Text style={styles.bioText} numberOfLines={4}>
              {bio.replace(/<[^>]*>/g, '')}
            </Text>
          ) : null}

          {albums.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('artist.albums')} />
              <FlatList
                data={albums}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={ALBUM_LIST_CONTENT_STYLE}
                keyExtractor={keyExtractorById}
                renderItem={renderAlbumRailItem}
                {...HORIZONTAL_LIST_PROPS}
              />
            </View>
          ) : null}

          {topSongs.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('artist.topSongs')} />
              <TrackList songs={topSongs} onPress={handleTrackPress} isActiveTrackId={player.currentTrack?.id} />
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
    marginBottom: Spacing.lg,
  },
  artistTitle: {
    fontSize: FontSize.display,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  albumCountText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bioText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
