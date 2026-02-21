import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useI18n } from '@/shared/i18n';
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

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client } = useAuth();
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => client!.getPlaylist(id as string),
    enabled: !!client && !!id,
  });

  const playlist = data?.playlist;
  const songs = playlist?.entry ?? [];

  const handlePlayAll = useMemo(() => createPlayAllHandler(player, songs), [player, songs]);
  const handleShuffle = useMemo(() => createShufflePlayHandler(player, songs), [player, songs]);
  const handleTrackPress = useMemo(() => createTrackPressHandler(player, songs), [player, songs]);

  const handleDeletePlaylist = useCallback(() => {
    if (!client || !id) return;
    Alert.alert(t('playlist.deletePlaylist'), t('playlist.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await client.deletePlaylist(id as string);
            await queryClient.invalidateQueries({ queryKey: ['playlists'] });
            await queryClient.invalidateQueries({ queryKey: ['playlist', id] });
            router.back();
          } catch {
            Alert.alert(t('common.error'), 'Failed to delete playlist');
          }
        },
      },
    ]);
  }, [client, id, queryClient, t]);

  const artSize = width - DETAIL_ART_MARGIN * 2;
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
        hitSlop={2}
        style={[styles.backBtn, { top: topPadding + HEADER_TOP_GAP_SM }]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={28} color={p.white} />
      </Pressable>
      <Pressable
        onPress={handleDeletePlaylist}
        hitSlop={2}
        style={[styles.deleteBtn, { top: topPadding + HEADER_TOP_GAP_SM }]}
        accessibilityLabel="Delete playlist"
        accessibilityRole="button"
      >
        <Ionicons name="trash-outline" size={20} color={p.white} />
      </Pressable>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError || (!playlist && !isLoading) ? (
        <EmptyState icon="alert-circle-outline" message="Failed to load playlist" />
      ) : playlist ? (
        <ScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          <View style={styles.artWrap}>
            <CoverArt coverArtId={playlist.coverArt} size={artSize} borderRadius={16} />
          </View>

          <View style={styles.info}>
            <Text style={styles.playlistTitle}>{playlist.name}</Text>
            {playlist.comment ? (
              <Text style={styles.comment} numberOfLines={2}>
                {playlist.comment}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              </Text>
              {playlist.duration > 0 ? (
                <Text style={styles.metaText}>{formatDuration(playlist.duration, true)}</Text>
              ) : null}
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

          <TrackList
            songs={songs}
            onPress={handleTrackPress}
            showArt
            useIndexInKey
            isActiveTrackId={player.currentTrack?.id}
          />
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
  deleteBtn: {
    position: 'absolute',
    right: Spacing.md,
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
  playlistTitle: {
    fontSize: FontSize.headline,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: Spacing.xs,
  },
  comment: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
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
