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
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  type ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { Playlist } from '@/shared/api/subsonic/types';
import { keyExtractorById, VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { CoverArt, EmptyState, formatDuration } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_SM,
  ICON_BUTTON_SIZE,
  PLAYLIST_ITEM_HEIGHT,
  SCROLL_BOTTOM_INSET,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { PRESSED_ROW } from '@/shared/theme/styles';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

const getItemLayout = (_data: unknown, index: number) => ({
  length: PLAYLIST_ITEM_HEIGHT,
  offset: PLAYLIST_ITEM_HEIGHT * index,
  index,
});

export default function PlaylistsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => client!.getPlaylists(),
    enabled: !!client,
  });

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  }, []);

  const openCreateModal = useCallback(() => {
    setNewPlaylistName('');
    setIsCreateModalVisible(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    if (isCreating) return;
    setIsCreateModalVisible(false);
  }, [isCreating]);

  const handleCreatePlaylist = useCallback(async () => {
    const playlistName = newPlaylistName.trim();
    if (!client || !playlistName || isCreating) return;

    setIsCreating(true);
    try {
      const created = await client.createPlaylist(playlistName, []);
      await queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreateModalVisible(false);
      setNewPlaylistName('');
      const createdId = created?.playlist?.id;
      if (createdId) {
        router.push(`/playlist/${createdId}`);
      }
    } catch {
      Alert.alert(t('common.error'), 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  }, [client, isCreating, newPlaylistName, queryClient, t]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Playlist>) => (
      <Pressable
        onPress={() => handlePlaylistPress(item)}
        style={({ pressed }) => [styles.playlistRow, pressed && PRESSED_ROW]}
        accessibilityLabel={item.name}
        accessibilityRole="button"
      >
        <CoverArt coverArtId={item.coverArt} size={56} borderRadius={8} />
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
            {item.duration > 0 ? ` \u00B7 ${formatDuration(item.duration, true)}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={p.textTertiary} />
      </Pressable>
    ),
    [handlePlaylistPress],
  );

  if (!fontsLoaded) return null;

  const playlists = data?.playlists?.playlist ?? [];
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
        <Text style={styles.title}>Playlists</Text>
        <Pressable
          onPress={openCreateModal}
          style={styles.actionBtn}
          accessibilityLabel="Add playlist"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={p.white} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" message={t('common.error')} />
      ) : playlists.length === 0 ? (
        <EmptyState icon="list-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={keyExtractorById}
          contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET }}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          {...VERTICAL_LIST_PROPS}
          renderItem={renderItem}
        />
      )}

      <Modal visible={isCreateModalVisible} transparent animationType="fade" onRequestClose={closeCreateModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeCreateModal}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('playlist.newPlaylist')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('playlist.playlistName')}
              placeholderTextColor={p.textTertiary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={handleCreatePlaylist}
              accessibilityLabel={t('playlist.playlistName')}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeCreateModal}
                style={styles.modalBtn}
                disabled={isCreating}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnSecondary}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleCreatePlaylist}
                style={[styles.modalBtn, styles.modalBtnPrimary, isCreating && { opacity: 0.6 }]}
                disabled={isCreating || !newPlaylistName.trim()}
                accessibilityLabel="Create playlist"
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnPrimaryText}>{t('playlist.create')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  actionBtn: {
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
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.smd,
    gap: Spacing.mlg,
  },
  playlistInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  playlistName: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
  },
  playlistMeta: {
    fontSize: FontSize.body2,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: p.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.sectionTitle,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.smd,
    fontSize: FontSize.input,
    fontFamily: 'Inter_400Regular',
    color: p.textPrimary,
    backgroundColor: p.black,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.smd,
  },
  modalBtn: {
    minWidth: 84,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalBtnPrimary: {
    backgroundColor: p.accent,
  },
  modalBtnSecondary: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_500Medium',
    color: p.textSecondary,
  },
  modalBtnPrimaryText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_600SemiBold',
    color: p.black,
  },
});
