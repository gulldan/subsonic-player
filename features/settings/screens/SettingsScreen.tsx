import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { formatDateTime } from '@/features/library/application/formatDateTime';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export default function SettingsScreen() {
  const { serverConfig, disconnect, client } = useAuth();
  const { t, locale, setLocale, availableLocales } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const [isStartingScan, setIsStartingScan] = useState(false);

  const {
    data: scanData,
    isFetching: isScanFetching,
    refetch: refetchScan,
  } = useQuery({
    queryKey: ['scanStatus'],
    queryFn: () => client!.getScanStatus(),
    enabled: !!client,
  });

  const { data: licenseData, refetch: refetchLicense } = useQuery({
    queryKey: ['license'],
    queryFn: () => client!.getLicense(),
    enabled: !!client,
    retry: false,
  });

  const { data: foldersData, refetch: refetchFolders } = useQuery({
    queryKey: ['musicFolders'],
    queryFn: () => client!.getMusicFolders(),
    enabled: !!client,
    retry: false,
  });

  const { data: extensionsData, refetch: refetchExtensions } = useQuery({
    queryKey: ['openSubsonicExtensions'],
    queryFn: () => client!.getOpenSubsonicExtensions(),
    enabled: !!client,
    retry: false,
  });

  const scanning = scanData?.scanStatus?.scanning ?? false;
  const scanCount = scanData?.scanStatus?.count ?? 0;
  const folderCount = foldersData?.musicFolders?.musicFolder?.length ?? 0;
  const extensionCount = extensionsData?.openSubsonicExtensions?.length ?? 0;

  useEffect(() => {
    if (!scanning) return;
    const timer = setInterval(() => {
      void refetchScan();
    }, 5000);
    return () => clearInterval(timer);
  }, [scanning, refetchScan]);

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleCycleLanguage = () => {
    const order: ('en' | 'ja' | 'ru')[] = ['en', 'ja', 'ru'];
    const currentIdx = order.indexOf(locale);
    const nextLocale = order[(currentIdx + 1) % order.length];
    setLocale(nextLocale);
  };

  const currentLanguageName = availableLocales.find((l) => l.code === locale)?.nativeName ?? locale;

  const handleDisconnect = () => {
    Alert.alert(t('auth.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => disconnect() },
    ]);
  };

  const handleRefreshServerData = async () => {
    await Promise.all([refetchScan(), refetchLicense(), refetchFolders(), refetchExtensions()]);
  };

  const handleStartScan = async (fullScan: boolean) => {
    if (!client || isStartingScan) return;

    setIsStartingScan(true);
    try {
      await client.startScan(fullScan);
      await refetchScan();
    } catch {
      Alert.alert(t('common.error'), 'Failed to start scan');
    } finally {
      setIsStartingScan(false);
    }
  };

  const rowPressableStyle = ({ pressed }: { pressed: boolean }) => [styles.row, pressed && { opacity: 0.6 }];

  const scanStatusLabel = scanning ? t('settings.scanning') : t('settings.idle');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + 16, paddingBottom: 100 }]}
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
          <Pressable onPress={handleDisconnect} style={rowPressableStyle}>
            <Ionicons name="log-out-outline" size={20} color={p.danger} />
            <Text style={styles.dangerLabel}>{t('auth.logout')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.serverInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="scan-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.scanStatus')}</Text>
              <Text style={styles.rowValue}>
                {scanStatusLabel}
                {isScanFetching ? '...' : ''}
              </Text>
              <Text style={styles.rowSubValue}>Count: {scanCount}</Text>
              <Text style={styles.rowSubValue}>Last scan: {formatDateTime(scanData?.scanStatus?.lastScan)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="folder-open-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.folders')}</Text>
              <Text style={styles.rowValue}>{folderCount}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="extension-puzzle-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.extensions')}</Text>
              <Text style={styles.rowValue}>{extensionCount}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={20} color={p.accent} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.license')}</Text>
              <Text style={styles.rowValue}>{licenseData?.license?.valid ? 'Valid' : '-'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable onPress={() => void handleStartScan(false)} style={rowPressableStyle} disabled={isStartingScan}>
            <Ionicons name="scan" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('settings.scanNow')}</Text>
            {isStartingScan ? <ActivityIndicator size="small" color={p.accent} /> : null}
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => void handleStartScan(true)} style={rowPressableStyle} disabled={isStartingScan}>
            <Ionicons name="refresh-circle-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('settings.fullScan')}</Text>
            {isStartingScan ? <ActivityIndicator size="small" color={p.accent} /> : null}
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => void handleRefreshServerData()} style={rowPressableStyle}>
            <Ionicons name="refresh" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('common.refresh')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.tools')}</Text>
        <View style={styles.card}>
          <Pressable onPress={() => router.push('/bookmarks')} style={rowPressableStyle}>
            <Ionicons name="bookmark-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('library.bookmarks')}</Text>
            <Ionicons name="chevron-forward" size={18} color={p.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => router.push('/shares')} style={rowPressableStyle}>
            <Ionicons name="share-social-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('library.shares')}</Text>
            <Ionicons name="chevron-forward" size={18} color={p.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => router.push('/radio')} style={rowPressableStyle}>
            <Ionicons name="radio-outline" size={20} color={p.accent} />
            <Text style={styles.rowLabel}>{t('library.radio')}</Text>
            <Ionicons name="chevron-forward" size={18} color={p.textTertiary} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <Pressable onPress={handleCycleLanguage} style={rowPressableStyle}>
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
    textTransform: 'uppercase',
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
  rowSubValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: p.textTertiary,
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
