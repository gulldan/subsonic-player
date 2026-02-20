import { useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/lib/i18n';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { EmptyState, TrackItem } from '@/components/ui';
import Colors from '@/constants/colors';
import type { Song } from '@/lib/api/types';

const p = Colors.palette;

export default function QueueScreen() {
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  const handleTrackPress = useCallback((song: Song) => {
    const idx = player.queue.findIndex((item) => item.id === song.id);
    player.playTrack(song, player.queue, idx >= 0 ? idx : 0);
    router.back();
  }, [player]);

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding + 12 }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('player.queue')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {player.queue.length === 0 ? (
        <EmptyState icon="list" message={t('common.noResults')} />
      ) : (
        <FlatList
          data={player.queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => (
            <TrackItem
              song={item}
              onPress={handleTrackPress}
              showArt
              isActive={index === player.queueIndex}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: p.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
