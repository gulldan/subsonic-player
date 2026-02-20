import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { AlbumCard, EmptyState } from '@/components/ui';
import Colors from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Album } from '@/lib/api/types';

const p = Colors.palette;

export default function GenreDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const encodedName = Array.isArray(name) ? name[0] : name;
  const genreName = encodedName ? decodeURIComponent(encodedName) : '';

  const { data, isLoading } = useQuery({
    queryKey: ['albums', 'byGenre', genreName],
    queryFn: () => client!.getAlbumList2('byGenre', 100, 0, { genre: genreName }),
    enabled: !!client && !!genreName,
  });

  if (!fontsLoaded) return null;

  const albums = data?.albumList2?.album ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const itemSize = (width - 48 - 16) / 2;

  const handleAlbumPress = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{genreName || t('album.genre')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : albums.length === 0 ? (
        <EmptyState icon="musical-notes" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={albums}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 20 }}
          columnWrapperStyle={{ gap: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AlbumCard album={item} onPress={handleAlbumPress} size={itemSize} />
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
});
