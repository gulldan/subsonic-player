import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

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

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('tabs.library')}</Text>

        {categories.map((cat) => (
          <Pressable
            key={cat.route}
            onPress={() => router.push(cat.route as any)}
            style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.6 }]}
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
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: p.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 14,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
});
