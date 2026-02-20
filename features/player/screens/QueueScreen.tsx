import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { memo, useCallback, useMemo, useRef } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playOrToggleTrack } from '@/features/player/core/application/trackListPlayback';
import { usePlayer } from '@/features/player/core/presentation/PlayerProvider';
import type { Song } from '@/shared/api/subsonic/types';
import { EmptyState, formatDuration, TrackItem } from '@/shared/components/media/ui';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;
const SPACER_40 = { width: 40 } as const;

const renderSwipeRightActions = () => (
  <View style={styles.swipeDeleteContainer}>
    <Ionicons name="trash" size={22} color={p.white} />
  </View>
);

const SwipeableTrackItem = memo(function SwipeableTrackItem({
  song,
  index,
  isActive,
  onPress,
  onRemove,
}: {
  song: Song;
  index: number;
  isActive: boolean;
  onPress: (song: Song) => void;
  onRemove: (index: number) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleOpen = useCallback(() => {
    onRemove(index);
    swipeableRef.current?.close();
  }, [onRemove, index]);

  if (isActive) {
    return <TrackItem song={song} onPress={onPress} showArt isActive />;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderSwipeRightActions}
      onSwipeableOpen={handleOpen}
      overshootRight={false}
    >
      <TrackItem song={song} onPress={onPress} showArt isActive={false} />
    </Swipeable>
  );
});

export default function QueueScreen() {
  const player = usePlayer();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  const handleTrackPress = useCallback(
    (song: Song) => {
      const isCurrentTrack = player.currentTrack?.id === song.id;
      void playOrToggleTrack(player, player.queue, song).then(() => {
        if (!isCurrentTrack) {
          router.back();
        }
      });
    },
    [player, player.queue, player.currentTrack?.id],
  );

  const handleRemove = useCallback(
    (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      player.removeFromQueue(index);
    },
    [player.removeFromQueue],
  );

  const handleClearQueue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.clearQueue();
  }, [player.clearQueue]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const keyExtractor = useCallback((item: Song, index: number) => `${item.id}-${index}`, []);

  const contentContainerStyle = useMemo(() => ({ paddingBottom: insets.bottom + 16 }), [insets.bottom]);

  const summaryText = useMemo(() => {
    const totalDuration = player.queue.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    return `${player.queue.length} track${player.queue.length !== 1 ? 's' : ''} · ${formatDuration(totalDuration, true)}`;
  }, [player.queue]);

  const queueIndex = player.queueIndex;
  const renderItem = useCallback(
    ({ item, index }: { item: Song; index: number }) => (
      <SwipeableTrackItem
        song={item}
        index={index}
        isActive={index === queueIndex}
        onPress={handleTrackPress}
        onRemove={handleRemove}
      />
    ),
    [queueIndex, handleTrackPress, handleRemove],
  );

  if (!fontsLoaded) return null;

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding + 12 }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.topBar}>
        <Pressable onPress={handleGoBack} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.title}>{t('player.queue')}</Text>
        {player.queue.length > 1 ? (
          <Pressable onPress={handleClearQueue} style={styles.closeBtn}>
            <Ionicons name="trash-outline" size={22} color={p.textTertiary} />
          </Pressable>
        ) : (
          <View style={SPACER_40} />
        )}
      </View>

      {player.queue.length === 0 ? (
        <EmptyState icon="list" message={t('common.noResults')} />
      ) : (
        <>
          <Text style={styles.summary}>{summaryText}</Text>
          <FlatList
            data={player.queue}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={contentContainerStyle}
          />
        </>
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
    marginBottom: 4,
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
  summary: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: p.textTertiary,
    textAlign: 'center',
    marginBottom: 8,
  },
  swipeDeleteContainer: {
    backgroundColor: p.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
