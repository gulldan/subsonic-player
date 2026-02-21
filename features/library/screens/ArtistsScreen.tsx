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
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
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
import { keyExtractorById, VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { CoverArt, EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  CONTENT_GAP,
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  SCREEN_PADDING_H,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_CARD } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;
const SPACER_40 = { width: ICON_BUTTON_SIZE } as const;
const COLUMN_WRAPPER_STYLE = { gap: Spacing.md } as const;

export default function ArtistsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artists'],
    queryFn: () => client!.getArtists(),
    enabled: !!client,
  });

  const numColumns = Math.floor(width / 120);
  const itemSize = (width - SCREEN_PADDING_H * 2 - (numColumns - 1) * CONTENT_GAP) / numColumns;

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: SCREEN_PADDING_H,
      paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET,
      gap: Spacing.xxl,
    }),
    [insets.bottom],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Artist>) => (
      <Pressable
        onPress={() => openArtist(item)}
        style={({ pressed }) => [{ width: itemSize, alignItems: 'center' as const }, pressed && PRESSED_CARD]}
        accessibilityLabel={item.name}
        accessibilityRole="button"
      >
        <CoverArt coverArtId={item.coverArt} size={itemSize - 8} borderRadius={(itemSize - 8) / 2} />
        <Text style={styles.artistName} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    ),
    [itemSize],
  );

  if (!fontsLoaded) return null;

  const artists: Artist[] = [];
  if (data?.artists?.index) {
    for (const idx of data.artists.index) {
      if (idx.artist) {
        artists.push(...idx.artist);
      }
    }
  }

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
        <Text style={styles.title}>{t('library.artists')}</Text>
        <View style={SPACER_40} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" message={t('common.error')} />
      ) : artists.length === 0 ? (
        <EmptyState icon="people-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={artists}
          numColumns={3}
          key="artists-3"
          keyExtractor={keyExtractorById}
          contentContainerStyle={contentContainerStyle}
          columnWrapperStyle={COLUMN_WRAPPER_STYLE}
          showsVerticalScrollIndicator={false}
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
  artistName: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
