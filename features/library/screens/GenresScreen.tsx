import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { type Href, router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { Genre } from '@/shared/api/subsonic/types';
import { VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  GENRE_ITEM_HEIGHT,
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

const getItemLayout = (_data: unknown, index: number) => ({
  length: GENRE_ITEM_HEIGHT,
  offset: GENRE_ITEM_HEIGHT * index,
  index,
});

export default function GenresScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['genres'],
    queryFn: () => client!.getGenres(),
    enabled: !!client,
  });

  const handleGenrePress = useCallback((genre: Genre) => {
    router.push(`/genre/${encodeURIComponent(genre.value)}` as Href);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Genre }) => (
      <Pressable
        onPress={() => handleGenrePress(item)}
        style={({ pressed }) => [styles.genreRow, pressed && PRESSED_CARD]}
        accessibilityLabel={item.value}
        accessibilityRole="button"
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
    ),
    [handleGenrePress],
  );

  if (!fontsLoaded) return null;

  const genres = data?.genres?.genre ?? [];
  const sortedGenres = [...genres].sort((a, b) => a.value.localeCompare(b.value));
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
        <Text style={styles.title}>{t('library.genres')}</Text>
        <View style={SPACER_40} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" message={t('common.error')} />
      ) : sortedGenres.length === 0 ? (
        <EmptyState icon="musical-notes" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={sortedGenres}
          keyExtractor={(item) => item.value}
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
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.mlg,
    gap: Spacing.mlg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: p.border,
  },
  genreInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  genreName: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
  },
  genreMeta: {
    fontSize: FontSize.body2,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
});
