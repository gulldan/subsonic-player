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
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { formatDateTime } from '@/features/library/application/formatDateTime';
import type { Share as SubsonicShare } from '@/shared/api/subsonic/types';
import { EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

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

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleOpenShare = async (share: SubsonicShare) => {
    try {
      await Linking.openURL(share.url);
    } catch {
      Alert.alert(t('common.error'), 'Failed to open share URL');
    }
  };

  const handleNativeShare = async (share: SubsonicShare) => {
    try {
      await Share.share({
        title: share.description ?? share.id,
        message: share.url,
        url: share.url,
      });
    } catch {
      Alert.alert(t('common.error'), 'Failed to share URL');
    }
  };

  const handleDeleteShare = (share: SubsonicShare) => {
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
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('library.shares')}</Text>
        <Pressable onPress={() => void refetch()} style={styles.refreshBtn}>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <Pressable
                onPress={() => void handleOpenShare(item)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
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
                <Pressable onPress={() => void handleNativeShare(item)} style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={18} color={p.textPrimary} />
                </Pressable>
                <Pressable onPress={() => handleDeleteShare(item)} style={styles.actionBtnDanger}>
                  <Ionicons name="trash-outline" size={18} color={p.danger} />
                </Pressable>
              </View>
            </View>
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
  refreshBtn: {
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
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    gap: 2,
  },
  shareTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  shareMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  rowActions: {
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
  actionBtnDanger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.overlay,
  },
});
