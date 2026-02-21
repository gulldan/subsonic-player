import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RepeatMode } from '@/features/player/core/domain/types';
import { PLAYER_ACCENT, PLAYER_CONTROL_SURFACE, PLAYER_CONTROL_SURFACE_ACTIVE } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';

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

export function PlayerPrimaryControls({
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
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    gap: 14,
  },
  modeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLAYER_CONTROL_SURFACE,
  },
  modeBtnActive: {
    backgroundColor: PLAYER_CONTROL_SURFACE_ACTIVE,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
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
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: p.black,
  },
});
