import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RepeatMode } from '@/features/player/core/domain/types';
import {
  PLAYER_ACCENT,
  PLAYER_CONTROL_BTN,
  PLAYER_CONTROL_SURFACE,
  PLAYER_CONTROL_SURFACE_ACTIVE,
  PLAYER_MODE_BTN,
  PLAYER_PLAY_BTN,
  REPEAT_BADGE,
} from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';
import { Spacing } from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

interface PlayerPrimaryControlsProps {
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
  isPlaying: boolean;
  onShuffle: () => void;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onRepeat: () => void;
}

export const PlayerPrimaryControls = memo(function PlayerPrimaryControls({
  isShuffled,
  repeatMode,
  isLoading,
  isPlaying,
  onShuffle,
  onPrevious,
  onPlayPause,
  onNext,
  onRepeat,
}: PlayerPrimaryControlsProps) {
  return (
    <View style={styles.controls}>
      <Pressable
        onPress={onShuffle}
        style={[styles.modeBtn, isShuffled && styles.modeBtnActive]}
        accessibilityLabel={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
        accessibilityRole="button"
      >
        <Ionicons name="shuffle" size={22} color={isShuffled ? PLAYER_ACCENT : p.textTertiary} />
      </Pressable>
      <Pressable
        onPress={onPrevious}
        style={styles.controlBtn}
        accessibilityLabel="Previous track"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-back" size={30} color={p.white} />
      </Pressable>
      <Pressable
        onPress={onPlayPause}
        style={styles.playPauseBtn}
        disabled={isLoading}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={p.black} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color={p.black} />
        )}
      </Pressable>
      <Pressable onPress={onNext} style={styles.controlBtn} accessibilityLabel="Next track" accessibilityRole="button">
        <Ionicons name="play-skip-forward" size={30} color={p.white} />
      </Pressable>
      <Pressable
        onPress={onRepeat}
        style={[styles.modeBtn, repeatMode !== 'off' && styles.modeBtnActive]}
        accessibilityLabel={`Repeat ${repeatMode}`}
        accessibilityRole="button"
      >
        <View>
          <Ionicons name="repeat" size={22} color={repeatMode !== 'off' ? PLAYER_ACCENT : p.textTertiary} />
          {repeatMode === 'one' ? (
            <View style={styles.repeatOneBadge}>
              <Text style={styles.repeatOneText}>1</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
    gap: Spacing.mlg,
  },
  modeBtn: {
    width: PLAYER_MODE_BTN,
    height: PLAYER_MODE_BTN,
    borderRadius: PLAYER_MODE_BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLAYER_CONTROL_SURFACE,
  },
  modeBtnActive: {
    backgroundColor: PLAYER_CONTROL_SURFACE_ACTIVE,
  },
  controlBtn: {
    width: PLAYER_CONTROL_BTN,
    height: PLAYER_CONTROL_BTN,
    borderRadius: PLAYER_CONTROL_BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: PLAYER_PLAY_BTN,
    height: PLAYER_PLAY_BTN,
    borderRadius: PLAYER_PLAY_BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLAYER_ACCENT,
    shadowColor: PLAYER_ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -1,
    right: -7,
    backgroundColor: PLAYER_ACCENT,
    borderRadius: REPEAT_BADGE / 2,
    width: REPEAT_BADGE,
    height: REPEAT_BADGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    fontSize: FontSize.xs,
    fontFamily: 'Inter_700Bold',
    color: p.black,
  },
});
