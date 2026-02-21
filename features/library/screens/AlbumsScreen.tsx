import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
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
import { openAlbum } from '@/features/library/application/navigation';
import { createGridContentStyle, keyExtractorById, VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { createAlbumCardRenderItem } from '@/shared/components/media/renderers';
import { EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  SCREEN_PADDING_H,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;
const SPACER_40 = { width: ICON_BUTTON_SIZE } as const;
const COLUMN_WRAPPER_STYLE = { gap: Spacing.lg } as const;

export default function AlbumsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['albums', 'alphabeticalByName'],
    queryFn: () => client!.getAlbumList2('alphabeticalByName', 50),
    enabled: !!client,
  });

  const contentContainerStyle = useMemo(() => createGridContentStyle(insets.bottom), [insets.bottom]);

  if (!fontsLoaded) return null;

  const albums = data?.albumList2?.album ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);
  const itemSize = (width - SCREEN_PADDING_H * 2 - Spacing.lg) / 2;
  const renderAlbumGridItem = createAlbumCardRenderItem(openAlbum, itemSize);

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
        <Text style={styles.title}>{t('library.albums')}</Text>
        <View style={SPACER_40} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" message={t('common.error')} />
      ) : albums.length === 0 ? (
        <EmptyState icon="disc-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={albums}
          numColumns={2}
          keyExtractor={keyExtractorById}
          contentContainerStyle={contentContainerStyle}
          columnWrapperStyle={COLUMN_WRAPPER_STYLE}
          showsVerticalScrollIndicator={false}
          renderItem={renderAlbumGridItem}
          {...VERTICAL_LIST_PROPS}
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
});
