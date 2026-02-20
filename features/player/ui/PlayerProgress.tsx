import type { RefObject } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { PLAYER_ACCENT, PLAYER_MUTED_TEXT, PLAYER_PROGRESS_TRACK } from '@/features/player/ui/constants';
import { formatDuration } from '@/shared/components/media/ui';

interface PlayerProgressProps {
  sliderRef: RefObject<View | null>;
  onSliderLayout: (event: LayoutChangeEvent) => void;
  panHandlers: Record<string, unknown>;
  progress: number;
  currentPos: number;
  remaining: number;
}

export function PlayerProgress({
  sliderRef,
  onSliderLayout,
  panHandlers,
  progress,
  currentPos,
  remaining,
}: PlayerProgressProps) {
  return (
    <View style={styles.progressSection}>
      <View ref={sliderRef} onLayout={onSliderLayout} style={styles.sliderTouchArea} {...panHandlers}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderProgress, { width: `${progress * 100}%` }]} />
          <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatDuration(currentPos)}</Text>
        <Text style={styles.timeText}>-{formatDuration(remaining > 0 ? remaining : 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    paddingHorizontal: 32,
    marginTop: 14,
  },
  sliderTouchArea: {
    height: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 5,
    backgroundColor: PLAYER_PROGRESS_TRACK,
    borderRadius: 3,
    overflow: 'visible',
  },
  sliderProgress: {
    height: 5,
    backgroundColor: PLAYER_ACCENT,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PLAYER_ACCENT,
    marginLeft: -7,
    shadowColor: PLAYER_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: PLAYER_MUTED_TEXT,
  },
});
