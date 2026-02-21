import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useTrackReactions } from '@/features/player/core/application/useTrackReactions';
import { usePlayer, usePlayerPosition } from '@/features/player/core/presentation/PlayerProvider';
import {
  MINI_PLAYER_GRADIENT,
  PLAYER_ACCENT,
  PLAYER_PROGRESS_TRACK,
  PLAYER_SHADOW,
} from '@/features/player/ui/constants';
import { runWithLightHaptic } from '@/features/player/ui/haptics';
import { CoverArt } from '@/shared/components/media/ui';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export const MiniPlayer = memo(function MiniPlayer({
  onPress,
  bottomOffset,
}: {
  onPress: () => void;
  bottomOffset: number;
}) {
  const { currentTrack, isPlaying, isLoading, togglePlayPause, next, previous, duration } = usePlayer();
  const position = usePlayerPosition();
  const { client } = useAuth();
  const { isStarred, toggleStar } = useTrackReactions({ client, track: currentTrack });

  const handlePlayPause = useCallback(async () => {
    await runWithLightHaptic(togglePlayPause);
  }, [togglePlayPause]);

  const handlePrevious = useCallback(async () => {
    await runWithLightHaptic(previous);
  }, [previous]);

  const handleNext = useCallback(async () => {
    await runWithLightHaptic(next);
  }, [next]);

  const handleStar = useCallback(async () => {
    await runWithLightHaptic(toggleStar);
  }, [toggleStar]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Animated.View entering={SlideInDown.duration(300)} style={[styles.miniPlayer, { bottom: bottomOffset }]}>
      <LinearGradient
        colors={MINI_PLAYER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.miniBackground}
      />
      <View style={styles.miniProgressBar}>
        <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable
        onPress={onPress}
        style={styles.miniPlayerContent}
        accessibilityLabel="Open player"
        accessibilityRole="button"
      >
        <CoverArt coverArtId={currentTrack.coverArt} size={48} borderRadius={8} />
        <View style={styles.miniPlayerInfo}>
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.miniPlayerArtist} numberOfLines={1}>
            {currentTrack.artist ?? ''}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={handleStar}
        style={styles.miniPlayerBtn}
        accessibilityLabel={isStarred ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityRole="button"
      >
        <Ionicons
          name={isStarred ? 'heart' : 'heart-outline'}
          size={22}
          color={isStarred ? PLAYER_ACCENT : p.textSecondary}
        />
      </Pressable>

      <Pressable
        onPress={handlePrevious}
        style={styles.miniPlayerBtn}
        accessibilityLabel="Previous track"
        accessibilityRole="button"
      >
        <Ionicons name="play-back" size={20} color={p.textSecondary} />
      </Pressable>

      <Pressable
        onPress={handlePlayPause}
        style={styles.miniPlayPauseBtn}
        disabled={isLoading}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={p.white} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={p.black} />
        )}
      </Pressable>

      <Pressable
        onPress={handleNext}
        style={styles.miniPlayerBtn}
        accessibilityLabel="Next track"
        accessibilityRole="button"
      >
        <Ionicons name="play-forward" size={20} color={p.textSecondary} />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  miniPlayer: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingRight: 4,
    overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      web: {
        boxShadow: `0 -2px 20px ${PLAYER_SHADOW}`,
      },
      default: {
        shadowColor: p.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.32,
        shadowRadius: 12,
        elevation: 16,
      },
    }),
  },
  miniBackground: StyleSheet.absoluteFillObject,
  miniProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: PLAYER_PROGRESS_TRACK,
  },
  miniProgressFill: {
    height: 3,
    backgroundColor: PLAYER_ACCENT,
    borderRadius: 1,
  },
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniPlayerInfo: {
    flex: 1,
    gap: 2,
  },
  miniPlayerTitle: {
    color: p.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  miniPlayerArtist: {
    color: p.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  miniPlayerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PLAYER_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
