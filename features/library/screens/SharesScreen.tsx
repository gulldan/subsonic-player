import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  type ListRenderItemInfo,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { Share as SubsonicShare } from '@/shared/api/subsonic/types';
import { keyExtractorById, VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  MIN_TOUCH_TARGET,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_ROW } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';
import { formatDateTime } from '@/shared/utils/formatDateTime';

const p = Colors.palette;

export default function SharesScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['shares'],
    queryFn: () => client!.getShares(),
    enabled: !!client,
  });

  const shares = data?.shares?.share ?? [];

  const handleOpenShare = useCallback(
    async (share: SubsonicShare) => {
      try {
        await Linking.openURL(share.url);
      } catch {
        Alert.alert(t('common.error'), 'Failed to open share URL');
      }
    },
    [t],
  );

  const handleNativeShare = useCallback(
    async (share: SubsonicShare) => {
      try {
        await Share.share({
          title: share.description ?? share.id,
          message: share.url,
          url: share.url,
        });
      } catch {
        Alert.alert(t('common.error'), 'Failed to share URL');
      }
    },
    [t],
  );

  const handleDeleteShare = useCallback(
    (share: SubsonicShare) => {
      if (!client) return;

      Alert.alert(t('common.delete'), share.description ?? share.url, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await client.deleteShare(share.id);
              await queryClient.invalidateQueries({ queryKey: ['shares'] });
            } catch {
              Alert.alert(t('common.error'), 'Failed to delete share');
            }
          },
        },
      ]);
    },
    [client, queryClient, t],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SubsonicShare>) => (
      <View style={styles.rowWrap}>
        <Pressable
          onPress={() => void handleOpenShare(item)}
          style={({ pressed }) => [styles.row, pressed && PRESSED_ROW]}
          accessibilityLabel={`Open share ${item.description?.trim() || item.url}`}
          accessibilityRole="button"
        >
          <View style={styles.iconWrap}>
            <Ionicons name="link-outline" size={20} color={p.accent} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.shareTitle} numberOfLines={1}>
              {item.description?.trim() || item.url}
            </Text>
            <Text style={styles.shareMeta} numberOfLines={1}>
              {item.url}
            </Text>
            <Text style={styles.shareMeta} numberOfLines={1}>
              Created: {formatDateTime(item.created)}
            </Text>
            {item.expires ? (
              <Text style={styles.shareMeta} numberOfLines={1}>
                Expires: {formatDateTime(item.expires)}
              </Text>
            ) : null}
            <Text style={styles.shareMeta} numberOfLines={1}>
              Visits: {item.visitCount} | Items: {item.entry?.length ?? 0}
            </Text>
          </View>
        </Pressable>

        <View style={styles.rowActions}>
          <Pressable
            onPress={() => void handleNativeShare(item)}
            style={styles.actionBtn}
            accessibilityLabel="Share link"
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={18} color={p.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteShare(item)}
            style={styles.actionBtnDanger}
            accessibilityLabel="Delete share"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={p.danger} />
          </Pressable>
        </View>
      </View>
    ),
    [handleOpenShare, handleNativeShare, handleDeleteShare],
  );

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + HEADER_TOP_GAP_SM }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={2}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.shares')}</Text>
        <Pressable
          onPress={() => void refetch()}
          style={styles.refreshBtn}
          accessibilityLabel="Refresh shares"
          accessibilityRole="button"
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={p.textPrimary} />
          ) : (
            <Ionicons name="refresh" size={20} color={p.textPrimary} />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : shares.length === 0 ? (
        <EmptyState icon="share-social-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={shares}
          keyExtractor={keyExtractorById}
          contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET }}
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
  refreshBtn: {
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
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  shareTitle: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  shareMeta: {
    fontSize: FontSize.sm,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  rowActions: {
    gap: Spacing.sm,
  },
  actionBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
  actionBtnDanger: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
});
