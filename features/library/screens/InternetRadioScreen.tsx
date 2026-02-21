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
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import type { InternetRadioStation } from '@/shared/api/subsonic/types';
import { EmptyState } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

function resolveHomepageUrl(station: InternetRadioStation): string {
  return station.homepageUrl ?? station.homePageUrl ?? '';
}

export default function InternetRadioScreen() {
  const { client } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStation, setEditingStation] = useState<InternetRadioStation | null>(null);
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['internetRadioStations'],
    queryFn: () => client!.getInternetRadioStations(),
    enabled: !!client,
  });

  const stations = useMemo(() => data?.internetRadioStations?.internetRadioStation ?? [], [data]);

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const openCreateModal = () => {
    setEditingStation(null);
    setName('');
    setStreamUrl('');
    setHomepageUrl('');
    setIsModalVisible(true);
  };

  const openEditModal = (station: InternetRadioStation) => {
    setEditingStation(station);
    setName(station.name);
    setStreamUrl(station.streamUrl);
    setHomepageUrl(resolveHomepageUrl(station));
    setIsModalVisible(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const handleSaveStation = async () => {
    if (!client || isSaving) return;
    const trimmedName = name.trim();
    const trimmedStream = streamUrl.trim();
    const trimmedHomepage = homepageUrl.trim();

    if (!trimmedName || !trimmedStream) {
      Alert.alert(t('common.error'), 'Name and stream URL are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingStation) {
        await client.updateInternetRadioStation(
          editingStation.id,
          trimmedStream,
          trimmedName,
          trimmedHomepage || undefined,
        );
      } else {
        await client.createInternetRadioStation(trimmedStream, trimmedName, trimmedHomepage || undefined);
      }
      await queryClient.invalidateQueries({ queryKey: ['internetRadioStations'] });
      setIsModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), 'Failed to save station');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStation = (station: InternetRadioStation) => {
    if (!client) return;

    Alert.alert(t('common.delete'), station.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await client.deleteInternetRadioStation(station.id);
            await queryClient.invalidateQueries({ queryKey: ['internetRadioStations'] });
          } catch {
            Alert.alert(t('common.error'), 'Failed to delete station');
          }
        },
      },
    ]);
  };

  const handleOpenStation = async (station: InternetRadioStation) => {
    try {
      await Linking.openURL(station.streamUrl);
    } catch {
      Alert.alert(t('common.error'), 'Failed to open station URL');
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
        <Text style={styles.title}>{t('library.radio')}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => void refetch()} style={styles.iconBtn}>
            {isRefetching ? (
              <ActivityIndicator size="small" color={p.textPrimary} />
            ) : (
              <Ionicons name="refresh" size={20} color={p.textPrimary} />
            )}
          </Pressable>
          <Pressable onPress={openCreateModal} style={styles.iconBtn}>
            <Ionicons name="add" size={22} color={p.textPrimary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={p.accent} />
        </View>
      ) : stations.length === 0 ? (
        <EmptyState icon="radio-outline" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.stationName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.stationMeta} numberOfLines={1}>
                    {item.streamUrl}
                  </Text>
                  {resolveHomepageUrl(item) ? (
                    <Text style={styles.stationMeta} numberOfLines={1}>
                      {resolveHomepageUrl(item)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => void handleOpenStation(item)} style={styles.actionBtn}>
                    <Ionicons name="open-outline" size={18} color={p.accent} />
                  </Pressable>
                  <Pressable onPress={() => openEditModal(item)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={18} color={p.textPrimary} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteStation(item)} style={styles.actionBtnDanger}>
                    <Ionicons name="trash-outline" size={18} color={p.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{editingStation ? 'Edit Station' : 'New Station'}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              placeholderTextColor={p.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Stream URL"
              placeholderTextColor={p.textTertiary}
              value={streamUrl}
              onChangeText={setStreamUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Homepage URL (optional)"
              placeholderTextColor={p.textTertiary}
              value={homepageUrl}
              onChangeText={setHomepageUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.modalBtn} disabled={isSaving}>
                <Text style={styles.modalBtnSecondary}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSaveStation()}
                style={[styles.modalBtn, styles.modalBtnPrimary, isSaving && { opacity: 0.6 }]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={p.black} />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>{editingStation ? 'Save' : 'Create'}</Text>
                )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  stationName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: p.textPrimary,
  },
  stationMeta: {
    fontSize: 12,
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
