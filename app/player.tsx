import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CoverArt, formatDuration } from '@/components/ui';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, Pressable, StyleSheet, Platform, PanResponder, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

const p = Colors.palette;

export default function PlayerScreen() {
  const player = usePlayer();
  const { seekTo } = player;
  const { client } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [isStarred, setIsStarred] = useState(!!player.currentTrack?.starred);
  const sliderRef = useRef<View>(null);
  const sliderMetrics = useRef({ x: 0, width: width - 64 });

  useEffect(() => {
    setIsStarred(!!player.currentTrack?.starred);
  }, [player.currentTrack?.id, player.currentTrack?.starred]);

  const refreshSliderMetrics = useCallback(() => {
    sliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      sliderMetrics.current = {
        x,
        width: measuredWidth > 0 ? measuredWidth : sliderMetrics.current.width,
      };
    });
  }, []);

  const onSliderLayout = useCallback((e: LayoutChangeEvent) => {
    sliderMetrics.current.width = e.nativeEvent.layout.width;
    requestAnimationFrame(() => refreshSliderMetrics());
  }, [refreshSliderMetrics]);

  useEffect(() => {
    sliderMetrics.current.width = width - 64;
    requestAnimationFrame(() => refreshSliderMetrics());
  }, [width, refreshSliderMetrics]);

  const getSeekPositionFromPageX = useCallback((pageX: number) => {
    if (player.duration <= 0) return 0;
    const { x, width: measuredWidth } = sliderMetrics.current;
    if (measuredWidth <= 0) return 0;
    const localX = pageX - x;
    const ratio = Math.max(0, Math.min(1, localX / measuredWidth));
    return ratio * player.duration;
  }, [player.duration]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        refreshSliderMetrics();
        setIsSeeking(true);
        setSeekPosition(getSeekPositionFromPageX(e.nativeEvent.pageX));
      },
      onPanResponderMove: (e) => {
        setSeekPosition(getSeekPositionFromPageX(e.nativeEvent.pageX));
      },
      onPanResponderRelease: (e) => {
        const finalPos = getSeekPositionFromPageX(e.nativeEvent.pageX);
        setSeekPosition(finalPos);
        seekTo(finalPos);
        setIsSeeking(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    }),
    [getSeekPositionFromPageX, refreshSliderMetrics, seekTo]
  );

  if (!fontsLoaded) return null;

  const track = player.currentTrack;
  if (!track) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={p.white} />
        </Pressable>
        <View style={styles.emptyWrap}>
          <Ionicons name="musical-notes" size={64} color={p.textTertiary} />
          <Text style={styles.emptyText}>No track playing</Text>
        </View>
      </View>
    );
  }

  const currentPos = isSeeking ? seekPosition : player.position;
  const progress = player.duration > 0 ? currentPos / player.duration : 0;
  const remaining = player.duration - currentPos;
  const artSize = width - 64;
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePlayPause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player.isPlaying) {
      await player.pause();
    } else {
      await player.resume();
    }
  };

  const handlePrevious = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await player.previous();
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await player.next();
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.toggleShuffle();
  };

  const handleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.toggleRepeat();
  };

  const handleOpenQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/queue');
  };

  const handleStar = async () => {
    if (!client || !track) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isStarred) {
        await client.unstar(track.id);
        setIsStarred(false);
      } else {
        await client.star(track.id);
        setIsStarred(true);
      }
      queryClient.invalidateQueries({ queryKey: ['starred'] });
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding + 12, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={p.white} />
        </Pressable>
        <Text style={styles.nowPlaying}>Now Playing</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.artContainer}>
        <View style={styles.artShadow}>
          <CoverArt coverArtId={track.coverArt} size={artSize} borderRadius={20} />
        </View>
      </View>

      <View style={styles.trackInfoSection}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{track.artist ?? ''}</Text>
        <Text style={styles.trackAlbum} numberOfLines={1}>{track.album ?? ''}</Text>
      </View>

      <View style={styles.progressSection}>
        <View
          ref={sliderRef}
          onLayout={onSliderLayout}
          style={styles.sliderTouchArea}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderProgress, { width: `${progress * 100}%` }]} />
            {isSeeking ? (
              <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]} />
            ) : null}
          </View>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDuration(currentPos)}</Text>
          <Text style={styles.timeText}>-{formatDuration(remaining > 0 ? remaining : 0)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={handleShuffle} style={styles.controlBtn}>
          <Ionicons name="shuffle" size={24} color={player.isShuffled ? p.accent : p.textTertiary} />
        </Pressable>
        <Pressable onPress={handlePrevious} style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={28} color={p.white} />
        </Pressable>
        <Pressable onPress={handlePlayPause} style={styles.playPauseBtn}>
          <Ionicons
            name={player.isPlaying ? 'pause-circle' : 'play-circle'}
            size={64}
            color={p.accent}
          />
        </Pressable>
        <Pressable onPress={handleNext} style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={28} color={p.white} />
        </Pressable>
        <Pressable onPress={handleRepeat} style={styles.controlBtn}>
          <View>
            <Ionicons
              name="repeat"
              size={24}
              color={player.repeatMode !== 'off' ? p.accent : p.textTertiary}
            />
            {player.repeatMode === 'one' ? (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Pressable onPress={handleStar} style={styles.bottomBtn}>
          <Ionicons
            name={isStarred ? 'star' : 'star-outline'}
            size={24}
            color={isStarred ? p.accent : p.textTertiary}
          />
        </Pressable>
        <Pressable onPress={handleOpenQueue} style={styles.bottomBtn}>
          <Ionicons
            name="list"
            size={24}
            color={player.queue.length > 0 ? p.accent : p.textTertiary}
          />
        </Pressable>
      </View>
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
  nowPlaying: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: p.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  artContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  artShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  trackInfoSection: {
    paddingHorizontal: 32,
    marginTop: 24,
    marginBottom: 8,
  },
  trackTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.accent,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: p.textSecondary,
  },
  progressSection: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  sliderTouchArea: {
    height: 44,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: p.surfaceHighlight,
    borderRadius: 2,
    overflow: 'visible',
  },
  sliderProgress: {
    height: 4,
    backgroundColor: p.accent,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: p.accent,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: p.textTertiary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 20,
  },
  controlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: p.accent,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: p.black,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    marginTop: 20,
  },
  bottomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.textTertiary,
  },
});
