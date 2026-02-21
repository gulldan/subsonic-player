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
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { openAlbum, openArtist } from '@/features/library/application/navigation';
import { createTrackPressHandler } from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Artist } from '@/shared/api/subsonic/types';
import { HORIZONTAL_LIST_PROPS, keyExtractorById } from '@/shared/components/lists/flatListProps';
import { createAlbumCardRenderItem } from '@/shared/components/media/renderers';
import { CoverArt, EmptyState, SectionHeader, TrackList } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_CARD } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;
const SPACER_40 = { width: ICON_BUTTON_SIZE } as const;
const ARTIST_LIST_CONTENT_STYLE = { paddingHorizontal: Spacing.xl, gap: Spacing.lg } as const;
const ARTIST_ITEM_STYLE = { alignItems: 'center' as const, width: 90 } as const;

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

  const renderArtistItem = useCallback(
    ({ item }: ListRenderItemInfo<Artist>) => (
      <Pressable
        onPress={() => openArtist(item)}
        style={({ pressed }) => [ARTIST_ITEM_STYLE, pressed && PRESSED_CARD]}
        accessibilityLabel={item.name}
        accessibilityRole="button"
      >
        <CoverArt coverArtId={item.coverArt} size={80} borderRadius={40} />
        <Text style={styles.artistName} numberOfLines={1}>
          {item.name}
        </Text>
      </Pressable>
    ),
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET }),
    [insets.bottom],
  );

  if (!fontsLoaded) return null;

  const starred = data?.starred2;
  const artists = starred?.artist ?? [];
  const albums = starred?.album ?? [];
  const songs = starred?.song ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);
  const isEmpty = artists.length === 0 && albums.length === 0 && songs.length === 0;
  const handleTrackPress = createTrackPressHandler(player, songs);
  const renderAlbumRailItem = createAlbumCardRenderItem(openAlbum, 150);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + HEADER_TOP_GAP_SM }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={2}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.starred')}</Text>
        <View style={SPACER_40} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isEmpty ? (
        <EmptyState icon="star-outline" message={t('common.noResults')} />
      ) : (
        <ScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          {artists.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('search.artists')} />
              <FlatList
                data={artists}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={ARTIST_LIST_CONTENT_STYLE}
                keyExtractor={keyExtractorById}
                {...HORIZONTAL_LIST_PROPS}
                renderItem={renderArtistItem}
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
                contentContainerStyle={ARTIST_LIST_CONTENT_STYLE}
                keyExtractor={keyExtractorById}
                renderItem={renderAlbumRailItem}
                {...HORIZONTAL_LIST_PROPS}
              />
            </View>
          ) : null}

          {songs.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t('search.songs')} />
              <TrackList songs={songs} onPress={handleTrackPress} showArt isActiveTrackId={player.currentTrack?.id} />
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSize.title,
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  artistName: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
