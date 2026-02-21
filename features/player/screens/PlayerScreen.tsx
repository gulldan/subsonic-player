import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  type LayoutChangeEvent,
  Share as NativeShare,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useTrackReactions } from '@/features/player/core/application/useTrackReactions';
import { usePlayer, usePlayerPosition } from '@/features/player/core/presentation/PlayerProvider';
import {
  PLAYER_ACCENT_GLOW,
  PLAYER_ERROR_SURFACE,
  PLAYER_GLOW_HEIGHT,
  PLAYER_GLOW_INSET,
  PLAYER_GRADIENT,
} from '@/features/player/ui/constants';
import { runWithLightHaptic } from '@/features/player/ui/haptics';
import { PlayerArtwork } from '@/features/player/ui/PlayerArtwork';
import { PlayerPrimaryControls } from '@/features/player/ui/PlayerPrimaryControls';
import { PlayerProgress } from '@/features/player/ui/PlayerProgress';
import { type PlayerSecondaryAction, PlayerSecondaryActions } from '@/features/player/ui/PlayerSecondaryActions';
import { PlayerTopBar } from '@/features/player/ui/PlayerTopBar';
import { PlayerTrackInfo } from '@/features/player/ui/PlayerTrackInfo';
import Colors from '@/shared/theme/colors';
import {
  HEADER_TOP_GAP_MD,
  PLAYER_ART_MARGIN,
  PLAYER_ART_MAX,
  Spacing,
  WEB_HEADER_OFFSET,
} from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

export default function PlayerScreen() {
  const player = usePlayer();
  const position = usePlayerPosition();
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const { isStarred, isDisliked, toggleStar, toggleDislike } = useTrackReactions({
    client,
    track: player.currentTrack,
  });
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const sliderRef = useRef<View>(null);
  const sliderMetrics = useRef({ x: 0, width: width - PLAYER_ART_MARGIN * 2 });
  const durationRef = useRef(player.duration);
  durationRef.current = player.duration;

  const refreshSliderMetrics = useCallback(() => {
    sliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      sliderMetrics.current = {
        x,
        width: measuredWidth > 0 ? measuredWidth : sliderMetrics.current.width,
      };
    });
  }, []);

  const onSliderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      sliderMetrics.current.width = e.nativeEvent.layout.width;
      requestAnimationFrame(() => refreshSliderMetrics());
    },
    [refreshSliderMetrics],
  );

  useEffect(() => {
    sliderMetrics.current.width = width - PLAYER_ART_MARGIN * 2;
    requestAnimationFrame(() => refreshSliderMetrics());
  }, [width, refreshSliderMetrics]);

  const getSeekPositionFromPageX = useCallback((pageX: number) => {
    const dur = durationRef.current;
    if (dur <= 0) return 0;
    const { x, width: measuredWidth } = sliderMetrics.current;
    if (measuredWidth <= 0) return 0;
    const localX = pageX - x;
    const ratio = Math.max(0, Math.min(1, localX / measuredWidth));
    return ratio * dur;
  }, []);

  const panResponder = useMemo(
    () =>
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
          void player.seekTo(finalPos);
          setIsSeeking(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },
        onPanResponderTerminate: () => {
          setIsSeeking(false);
        },
      }),
    [getSeekPositionFromPageX, player.seekTo, refreshSliderMetrics],
  );

  const handlePlayPause = useCallback(async () => {
    await runWithLightHaptic(player.togglePlayPause);
  }, [player.togglePlayPause]);

  const handlePrevious = useCallback(async () => {
    await runWithLightHaptic(player.previous);
  }, [player.previous]);

  const handleNext = useCallback(async () => {
    await runWithLightHaptic(player.next);
  }, [player.next]);

  const handleShuffle = useCallback(() => {
    void runWithLightHaptic(player.toggleShuffle);
  }, [player.toggleShuffle]);

  const handleRepeat = useCallback(() => {
    void runWithLightHaptic(player.toggleRepeat);
  }, [player.toggleRepeat]);

  const handleOpenQueue = useCallback(() => {
    void runWithLightHaptic(() => router.push('/queue'));
  }, []);

  const handleRandom = useCallback(async () => {
    await runWithLightHaptic(player.playRandom);
  }, [player.playRandom]);

  const handleStar = useCallback(async () => {
    await runWithLightHaptic(toggleStar);
  }, [toggleStar]);

  const handleDislike = useCallback(async () => {
    await runWithLightHaptic(toggleDislike);
  }, [toggleDislike]);

  const handleSaveBookmark = useCallback(async () => {
    const track = player.currentTrack;
    if (!client || !track) return;

    const positionMs = Math.max(0, Math.floor(position * 1000));

    try {
      await runWithLightHaptic(async () => {
        await client.createBookmark(track.id, positionMs, track.title);
      });
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch {
      Alert.alert('Error', 'Failed to save bookmark');
    }
  }, [client, player.currentTrack, position, queryClient]);

  const handleShareTrack = useCallback(async () => {
    const track = player.currentTrack;
    if (!client || !track) return;

    try {
      const response = await runWithLightHaptic(async () => {
        return client.createShare([track.id], `SonicWave: ${track.title}`);
      });
      await queryClient.invalidateQueries({ queryKey: ['shares'] });
      const url = response.shares?.share?.[0]?.url;
      if (!url) {
        Alert.alert('Error', 'Share URL was not returned by server');
        return;
      }
      await NativeShare.share({
        title: track.title,
        message: url,
        url,
      });
    } catch {
      Alert.alert('Error', 'Failed to create share link');
    }
  }, [client, player.currentTrack, queryClient]);

  const secondaryActions = useMemo<PlayerSecondaryAction[]>(
    () => [
      {
        key: 'favorite',
        icon: isStarred ? 'heart' : 'heart-outline',
        active: isStarred,
        accessibilityLabel: isStarred ? 'Remove from favorites' : 'Add to favorites',
        onPress: handleStar,
      },
      {
        key: 'dislike',
        icon: isDisliked ? 'heart-dislike' : 'heart-dislike-outline',
        active: isDisliked,
        activeColor: p.danger,
        activeBackgroundColor: PLAYER_ERROR_SURFACE,
        accessibilityLabel: isDisliked ? 'Remove dislike' : 'Dislike track',
        onPress: handleDislike,
      },
      {
        key: 'bookmark',
        icon: 'bookmark-outline',
        accessibilityLabel: 'Save bookmark',
        onPress: handleSaveBookmark,
      },
      {
        key: 'share',
        icon: 'share-social-outline',
        accessibilityLabel: 'Share track',
        onPress: handleShareTrack,
      },
      {
        key: 'random',
        icon: 'dice-outline',
        accessibilityLabel: 'Play random track',
        onPress: handleRandom,
      },
      {
        key: 'queue',
        icon: 'list',
        active: player.queue.length > 0,
        accessibilityLabel: 'View queue',
        onPress: handleOpenQueue,
      },
    ],
    [
      handleDislike,
      handleOpenQueue,
      handleRandom,
      handleSaveBookmark,
      handleShareTrack,
      handleStar,
      isDisliked,
      isStarred,
      player.queue.length,
    ],
  );

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  if (!fontsLoaded) return null;

  const track = player.currentTrack;
  if (!track) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
        <PlayerTopBar onClose={handleGoBack} />
        <View style={styles.emptyWrap}>
          <Ionicons name="musical-notes" size={64} color={p.textTertiary} />
          <Text style={styles.emptyText}>No track playing</Text>
        </View>
      </View>
    );
  }

  const currentPos = isSeeking ? seekPosition : position;
  const progressRaw = player.duration > 0 ? currentPos / player.duration : 0;
  const progress = Math.max(0, Math.min(1, progressRaw));
  const remaining = player.duration - currentPos;
  const artSize = Math.min(width - PLAYER_ART_MARGIN * 2, PLAYER_ART_MAX);
  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPadding + HEADER_TOP_GAP_MD, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <LinearGradient
        colors={PLAYER_GRADIENT}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.accentGlow} />

      <PlayerTopBar onClose={handleGoBack} />
      <PlayerArtwork coverArtId={track.coverArt} size={artSize} />
      <PlayerTrackInfo title={track.title} artist={track.artist} album={track.album} />

      {player.loadError ? (
        <Pressable
          onPress={player.retryPlay}
          style={styles.errorBanner}
          accessibilityLabel="Retry playback"
          accessibilityRole="button"
        >
          <Ionicons name="alert-circle" size={18} color={p.danger} />
          <Text style={styles.errorText}>{player.loadError}</Text>
          <Ionicons name="refresh" size={18} color={p.danger} />
        </Pressable>
      ) : null}

      <PlayerProgress
        sliderRef={sliderRef}
        onSliderLayout={onSliderLayout}
        panHandlers={panResponder.panHandlers as Record<string, unknown>}
        progress={progress}
        currentPos={currentPos}
        remaining={remaining}
      />

      <PlayerPrimaryControls
        isShuffled={player.isShuffled}
        repeatMode={player.repeatMode}
        isLoading={player.isLoading}
        isPlaying={player.isPlaying}
        onShuffle={handleShuffle}
        onPrevious={handlePrevious}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onRepeat={handleRepeat}
      />

      <PlayerSecondaryActions actions={secondaryActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.black,
  },
  accentGlow: {
    position: 'absolute',
    top: -120,
    left: PLAYER_GLOW_INSET,
    right: PLAYER_GLOW_INSET,
    height: PLAYER_GLOW_HEIGHT,
    borderRadius: 200,
    backgroundColor: PLAYER_ACCENT_GLOW,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_500Medium',
    color: p.textTertiary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xxxl,
    marginTop: Spacing.smd,
    paddingVertical: Spacing.smd,
    paddingHorizontal: Spacing.mlg,
    backgroundColor: PLAYER_ERROR_SURFACE,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.body2,
    fontFamily: 'Inter_500Medium',
    color: p.danger,
  },
});
