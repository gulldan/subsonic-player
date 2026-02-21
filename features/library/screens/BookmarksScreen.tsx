import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  type ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Bookmark, Song } from '@/shared/api/subsonic/types';
import { VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { CoverArt, EmptyState, formatDuration } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  BOOKMARK_ITEM_HEIGHT,
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  MIN_TOUCH_TARGET,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_ROW } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';
import { formatDateTime } from '@/shared/utils/formatDateTime';

const p = Colors.palette;

const getItemLayout = (_data: unknown, index: number) => ({
  length: BOOKMARK_ITEM_HEIGHT,
  offset: BOOKMARK_ITEM_HEIGHT * index,
  index,
});

export default function BookmarksScreen() {
  const { client } = useAuth();
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => client!.getBookmarks(),
    enabled: !!client,
  });

  const bookmarks = data?.bookmarks?.bookmark ?? [];

  const queue = useMemo<Song[]>(() => {
    return bookmarks.map((bookmark) => bookmark.entry).filter((entry): entry is Song => !!entry?.id);
  }, [bookmarks]);

  const handlePlayBookmark = useCallback(
    async (bookmark: Bookmark) => {
      const track = bookmark.entry;
      if (!track) return;

      const queueIndex = queue.findIndex((item) => item.id === track.id);
      const targetQueue = queue.length > 0 ? queue : [track];

      try {
        await player.playTrack(track, targetQueue, queueIndex >= 0 ? queueIndex : 0);
        const seekSeconds = Math.max(0, Math.floor(bookmark.position / 1000));
        if (seekSeconds > 0) {
          await player.seekTo(seekSeconds);
        }
      } catch {
        Alert.alert(t('common.error'), 'Failed to play bookmark');
      }
    },
    [player, queue, t],
  );

  const handleDeleteBookmark = useCallback(
    (bookmark: Bookmark) => {
      if (!client || !bookmark.entry) return;

      Alert.alert(t('common.delete'), bookmark.entry.title, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await client.deleteBookmark(bookmark.entry.id);
              await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            } catch {
              Alert.alert(t('common.error'), 'Failed to delete bookmark');
            }
          },
        },
      ]);
    },
    [client, queryClient, t],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Bookmark>) => (
      <Pressable
        onPress={() => void handlePlayBookmark(item)}
        onLongPress={() => handleDeleteBookmark(item)}
        style={({ pressed }) => [styles.row, pressed && PRESSED_ROW]}
        accessibilityLabel={`Play ${item.entry?.title ?? 'bookmark'}`}
        accessibilityRole="button"
      >
        <CoverArt coverArtId={item.entry?.coverArt} size={52} borderRadius={8} />
        <View style={styles.rowInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.entry?.title ?? '-'}
          </Text>
          <Text style={styles.trackMeta} numberOfLines={1}>
            {item.entry?.artist ?? '-'}
          </Text>
          <Text style={styles.trackMeta} numberOfLines={1}>
            {formatDuration(item.position)} | {formatDateTime(item.changed)}
          </Text>
        </View>
        <Pressable
          onPress={() => handleDeleteBookmark(item)}
          style={styles.deleteBtn}
          accessibilityLabel={`Delete bookmark ${item.entry?.title ?? ''}`}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={18} color={p.danger} />
        </Pressable>
      </Pressable>
    ),
    [handlePlayBookmark, handleDeleteBookmark],
  );

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + HEADER_TOP_GAP_SM }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={2}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.bookmarks')}</Text>
        <Pressable
          onPress={() => void refetch()}
          style={styles.refreshBtn}
          accessibilityLabel="Refresh bookmarks"
          accessibilityRole="button"
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={p.textPrimary} />
          ) : (
            <Ionicons name="refresh" size={20} color={p.textPrimary} />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : bookmarks.length === 0 ? (
        <EmptyState icon="bookmark-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.entry?.id ?? `${item.position}`}
          contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET }}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          {...VERTICAL_LIST_PROPS}
          renderItem={renderItem}
        />
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
  refreshBtn: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.smd,
    gap: Spacing.md,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  trackTitle: {
    fontSize: FontSize.input,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  trackMeta: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  deleteBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
});
