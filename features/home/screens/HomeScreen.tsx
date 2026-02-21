import { Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { Album } from '@/shared/api/subsonic/types';
import { HORIZONTAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { AlbumCard, SectionHeader, Shimmer } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import { openAlbum } from '@/shared/navigation/navigation';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

function ShimmerRow() {
  return (
    <View style={styles.shimmerRow}>
      {[1, 2, 3].map((i) => (
        <Shimmer key={i} width={160} height={160} borderRadius={12} style={{ marginRight: 12 }} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_600SemiBold, Inter_700Bold });

  const { data: randomData, isLoading: randomLoading } = useQuery({
    queryKey: ['albumList', 'random'],
    queryFn: () => client!.getAlbumList2('random', 10),
    enabled: !!client,
  });

  const { data: newestData, isLoading: newestLoading } = useQuery({
    queryKey: ['albumList', 'newest'],
    queryFn: () => client!.getAlbumList2('newest', 10),
    enabled: !!client,
  });

  const { data: frequentData, isLoading: frequentLoading } = useQuery({
    queryKey: ['albumList', 'frequent'],
    queryFn: () => client!.getAlbumList2('frequent', 10),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;
  if (!client) return null;

  const randomAlbums = randomData?.albumList2?.album ?? [];
  const newestAlbums = newestData?.albumList2?.album ?? [];
  const frequentAlbums = frequentData?.albumList2?.album ?? [];

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <View style={{ marginRight: 12 }}>
      <AlbumCard album={item} onPress={openAlbum} size={160} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>SonicWave</Text>

        <View style={styles.section}>
          <SectionHeader title={t('home.randomPicks')} />
          {randomLoading ? (
            <ShimmerRow />
          ) : (
            <FlatList
              data={randomAlbums}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={randomAlbums.length > 0}
              {...HORIZONTAL_LIST_PROPS}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.newAdditions')} />
          {newestLoading ? (
            <ShimmerRow />
          ) : (
            <FlatList
              data={newestAlbums}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={newestAlbums.length > 0}
              {...HORIZONTAL_LIST_PROPS}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.frequentlyPlayed')} />
          {frequentLoading ? (
            <ShimmerRow />
          ) : (
            <FlatList
              data={frequentAlbums}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={frequentAlbums.length > 0}
              {...HORIZONTAL_LIST_PROPS}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.black,
  },
  scrollContent: {
    flexGrow: 1,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  shimmerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
});
