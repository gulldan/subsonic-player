import { router, Stack } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { CoverArt, formatDuration } from '@/components/ui';
import Colors from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Playlist } from '@/lib/api/types';

const p = Colors.palette;

export default function PlaylistsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => client!.getPlaylists(),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;

  const playlists = data?.playlists?.playlist ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>Playlists</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePlaylistPress(item)}
              style={({ pressed }) => [styles.playlistRow, pressed && { opacity: 0.6 }]}
            >
              <CoverArt coverArtId={item.coverArt} size={56} borderRadius={8} />
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistMeta}>
                  {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
                  {item.duration > 0 ? ` \u00B7 ${formatDuration(item.duration, true)}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={p.textTertiary} />
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
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  playlistInfo: {
    flex: 1,
    gap: 3,
  },
  playlistName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
  },
  playlistMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
});
