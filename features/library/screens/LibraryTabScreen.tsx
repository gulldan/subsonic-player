import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { type Href, router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  CATEGORY_ROW_HEIGHT,
  HEADER_TOP_GAP_LG,
  SCREEN_PADDING_H,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_ROW } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

interface CategoryItem {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  route: string;
}

const categories: CategoryItem[] = [
  { icon: 'people-outline', labelKey: 'library.artists', route: '/artists' },
  { icon: 'disc-outline', labelKey: 'library.albums', route: '/albums' },
  { icon: 'list-outline', labelKey: 'library.playlists', route: '/playlists' },
  { icon: 'musical-notes-outline', labelKey: 'library.genres', route: '/genres' },
  { icon: 'star-outline', labelKey: 'library.starred', route: '/starred' },
  { icon: 'bookmark-outline', labelKey: 'library.bookmarks', route: '/bookmarks' },
  { icon: 'share-social-outline', labelKey: 'library.shares', route: '/shares' },
  { icon: 'radio-outline', labelKey: 'library.radio', route: '/radio' },
];

export default function LibraryScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + HEADER_TOP_GAP_LG, paddingBottom: SCROLL_BOTTOM_INSET },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('tabs.library')}</Text>

        {categories.map((cat) => (
          <Pressable
            key={cat.route}
            onPress={() => router.push(cat.route as Href)}
            style={({ pressed }) => [styles.categoryRow, pressed && PRESSED_ROW]}
            accessibilityLabel={t(cat.labelKey)}
            accessibilityRole="button"
          >
            <Ionicons name={cat.icon} size={22} color={p.accent} />
            <Text style={styles.categoryLabel}>{t(cat.labelKey)}</Text>
            <Ionicons name="chevron-forward" size={20} color={p.textTertiary} />
          </Pressable>
        ))}
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
  title: {
    fontSize: FontSize.display,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    paddingHorizontal: SCREEN_PADDING_H,
    marginBottom: Spacing.xxl,
  },
  categoryRow: {
    height: CATEGORY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    backgroundColor: p.surface,
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.mlg,
  },
  categoryLabel: {
    flex: 1,
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
});
