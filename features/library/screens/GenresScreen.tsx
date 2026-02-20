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
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { Genre } from '@/shared/api/subsonic/types';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export default function GenresScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: () => client!.getGenres(),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;

  const genres = data?.genres?.genre ?? [];
  const sortedGenres = [...genres].sort((a, b) => a.value.localeCompare(b.value));
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const handleGenrePress = (genre: Genre) => {
    router.push({
      pathname: '/genre/[name]',
      params: { name: encodeURIComponent(genre.value) },
    } as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.genres')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : (
        <FlatList
          data={sortedGenres}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleGenrePress(item)}
              style={({ pressed }) => [styles.genreRow, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="musical-notes" size={20} color={p.accent} />
              <View style={styles.genreInfo}>
                <Text style={styles.genreName}>{item.value}</Text>
                <Text style={styles.genreMeta}>
                  {item.albumCount} {item.albumCount === 1 ? 'album' : 'albums'} · {item.songCount}{' '}
                  {item.songCount === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={p.textTertiary} />
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
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: p.border,
  },
  genreInfo: {
    flex: 1,
    gap: 2,
  },
  genreName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
  },
  genreMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
});
