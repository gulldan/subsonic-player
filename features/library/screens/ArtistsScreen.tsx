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
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { openArtist } from '@/features/library/application/navigation';
import type { Artist } from '@/shared/api/subsonic/types';
import { VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { CoverArt } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export default function ArtistsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading } = useQuery({
    queryKey: ['artists'],
    queryFn: () => client!.getArtists(),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;

  const artists: Artist[] = [];
  if (data?.artists?.index) {
    for (const idx of data.artists.index) {
      if (idx.artist) {
        artists.push(...idx.artist);
      }
    }
  }

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const numColumns = Math.floor(width / 120);
  const itemSize = (width - 20 * 2 - (numColumns - 1) * 12) / numColumns;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.artists')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : (
        <FlatList
          data={artists}
          numColumns={3}
          key="artists-3"
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 24 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          {...VERTICAL_LIST_PROPS}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openArtist(item)}
              style={({ pressed }) => [{ width: itemSize, alignItems: 'center' }, pressed && { opacity: 0.7 }]}
            >
              <CoverArt coverArtId={item.coverArt} size={itemSize - 8} borderRadius={(itemSize - 8) / 2} />
              <Text style={styles.artistName} numberOfLines={2}>
                {item.name}
              </Text>
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
  artistName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
});
