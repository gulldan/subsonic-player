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
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { VERTICAL_LIST_PROPS } from '@/shared/components/lists/flatListProps';
import { CoverArt, formatDuration } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export default function PlaylistsScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => client!.getPlaylists(),
    enabled: !!client,
  });

  if (!fontsLoaded) return null;

  const playlists = data?.playlists?.playlist ?? [];
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  const openCreateModal = () => {
    setNewPlaylistName('');
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateModalVisible(false);
  };

  const handleCreatePlaylist = async () => {
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
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>Playlists</Text>
        <Pressable onPress={openCreateModal} style={styles.actionBtn}>
          <Ionicons name="add" size={24} color={p.white} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          {...VERTICAL_LIST_PROPS}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePlaylistPress(item)}
              style={({ pressed }) => [styles.playlistRow, pressed && { opacity: 0.6 }]}
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
          )}
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
            />
            <View style={styles.modalActions}>
              <Pressable onPress={closeCreateModal} style={styles.modalBtn} disabled={isCreating}>
                <Text style={styles.modalBtnSecondary}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleCreatePlaylist}
                style={[styles.modalBtn, styles.modalBtnPrimary, isCreating && { opacity: 0.6 }]}
                disabled={isCreating || !newPlaylistName.trim()}
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
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
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
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  playlistInfo: {
    flex: 1,
    gap: 3,
  },
  playlistName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.textPrimary,
  },
  playlistMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: p.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: p.textPrimary,
    backgroundColor: p.black,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    minWidth: 84,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalBtnPrimary: {
    backgroundColor: p.accent,
  },
  modalBtnSecondary: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: p.textSecondary,
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: p.black,
  },
});
