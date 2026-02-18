import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

const p = Colors.palette;

export default function SettingsScreen() {
  const { serverConfig, disconnect } = useAuth();
  const { t, locale, setLocale, availableLocales } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleCycleLanguage = () => {
    const order: Array<'en' | 'ja' | 'ru'> = ['en', 'ja', 'ru'];
    const currentIdx = order.indexOf(locale);
    const nextLocale = order[(currentIdx + 1) % order.length];
    setLocale(nextLocale);
  };

  const currentLanguageName = availableLocales.find((l) => l.code === locale)?.nativeName ?? locale;

  const handleDisconnect = () => {
    Alert.alert(
      t('auth.logout'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: () => disconnect() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('tabs.settings')}</Text>

        <Text style={styles.sectionTitle}>{t('settings.server')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="server-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('auth.serverUrl')}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {serverConfig?.url ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('auth.username')}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {serverConfig?.username ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable
            onPress={handleDisconnect}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="log-out-outline" size={20} color={p.danger} />
            <Text style={styles.dangerLabel}>{t('auth.logout')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={handleCycleLanguage}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="language-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <Text style={styles.rowValue}>{currentLanguageName}</Text>
            <Ionicons name="chevron-forward" size={18} color={p.textTertiary} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('settings.version')}</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
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
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: p.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: p.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  dangerLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: p.danger,
  },
  divider: {
    height: 1,
    backgroundColor: p.border,
    marginLeft: 48,
  },
});
