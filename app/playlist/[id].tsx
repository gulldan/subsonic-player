import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useI18n } from '@/lib/i18n';
import { CoverArt, TrackItem, formatDuration } from '@/components/ui';
import Colors from '@/constants/colors';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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

  const { data, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => client!.getPlaylist(id as string),
    enabled: !!client && !!id,
  });

  if (!fontsLoaded) return null;

  const playlist = data?.playlist;
  const songs = playlist?.entry ?? [];
  const artSize = width - 80;
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePlayAll = async () => {
    if (songs.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.playTrack(songs[0], songs, 0);
  };

  const handleShuffle = async () => {
    if (songs.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!player.isShuffled) player.toggleShuffle();
    player.playTrack(songs[0], songs, 0);
  };

  const handleTrackPress = (song: typeof songs[0]) => {
    const idx = songs.findIndex(s => s.id === song.id);
    player.playTrack(song, songs, idx >= 0 ? idx : 0);
  };

  const handleDeletePlaylist = () => {
    if (!client || !id) return;
    Alert.alert(
      t('playlist.deletePlaylist'),
      t('playlist.confirmDelete'),
      [
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
      ]
    );
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
      <Pressable
        onPress={handleDeletePlaylist}
        style={[styles.deleteBtn, { top: topPadding + 8 }]}
      >
        <Ionicons name="trash-outline" size={20} color={p.white} />
      </Pressable>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : playlist ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.artWrap}>
            <CoverArt coverArtId={playlist.coverArt} size={artSize} borderRadius={16} />
          </View>

          <View style={styles.info}>
            <Text style={styles.playlistTitle}>{playlist.name}</Text>
            {playlist.comment ? (
              <Text style={styles.comment} numberOfLines={2}>{playlist.comment}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</Text>
              {playlist.duration > 0 ? <Text style={styles.metaText}>{formatDuration(playlist.duration, true)}</Text> : null}
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

          {songs.map((song, i) => (
            <TrackItem
              key={`${song.id}-${i}`}
              song={song}
              index={i + 1}
              onPress={handleTrackPress}
              showArt
              isActive={player.currentTrack?.id === song.id}
            />
          ))}
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
  deleteBtn: {
    position: 'absolute',
    right: 12,
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
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  info: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  playlistTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: 4,
  },
  comment: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
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
