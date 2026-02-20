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
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { formatDateTime } from '@/features/library/application/formatDateTime';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Bookmark, Song } from '@/shared/api/subsonic/types';
import { CoverArt, EmptyState, formatDuration } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

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

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePlayBookmark = async (bookmark: Bookmark) => {
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
  };

  const handleDeleteBookmark = (bookmark: Bookmark) => {
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
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.bookmarks')}</Text>
        <Pressable onPress={() => void refetch()} style={styles.refreshBtn}>
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
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => void handlePlayBookmark(item)}
              onLongPress={() => handleDeleteBookmark(item)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
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
              <Pressable onPress={() => handleDeleteBookmark(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={p.danger} />
              </Pressable>
            </Pressable>
          )}
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
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  trackMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
});
