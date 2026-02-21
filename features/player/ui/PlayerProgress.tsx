import { memo, type RefObject } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import {
  PLAYER_ACCENT,
  PLAYER_MUTED_TEXT,
  PLAYER_PROGRESS_TRACK,
  SLIDER_THUMB,
  SLIDER_TOUCH,
  SLIDER_TRACK,
} from '@/features/player/ui/constants';
import { formatDuration } from '@/shared/components/media/ui';
import { Spacing } from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

interface PlayerProgressProps {
  sliderRef: RefObject<View | null>;
  onSliderLayout: (event: LayoutChangeEvent) => void;
  panHandlers: Record<string, unknown>;
  progress: number;
  currentPos: number;
  remaining: number;
}

export const PlayerProgress = memo(function PlayerProgress({
  sliderRef,
  onSliderLayout,
  panHandlers,
  progress,
  currentPos,
  remaining,
}: PlayerProgressProps) {
  return (
    <View style={styles.progressSection}>
      <View
        ref={sliderRef}
        onLayout={onSliderLayout}
        style={styles.sliderTouchArea}
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        {...panHandlers}
      >
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
});

const styles = StyleSheet.create({
  progressSection: {
    paddingHorizontal: Spacing.xxxl,
    marginTop: Spacing.mlg,
  },
  sliderTouchArea: {
    height: SLIDER_TOUCH,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: SLIDER_TRACK,
    backgroundColor: PLAYER_PROGRESS_TRACK,
    borderRadius: 3,
    overflow: 'visible',
  },
  sliderProgress: {
    height: SLIDER_TRACK,
    backgroundColor: PLAYER_ACCENT,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -((SLIDER_THUMB - SLIDER_TRACK) / 2),
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    backgroundColor: PLAYER_ACCENT,
    marginLeft: -(SLIDER_THUMB / 2),
    shadowColor: PLAYER_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: PLAYER_MUTED_TEXT,
  },
});
