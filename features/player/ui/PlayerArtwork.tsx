import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ART_SHADOW_ELEVATION,
  ART_SHADOW_OFFSET_Y,
  ART_SHADOW_OPACITY,
  ART_SHADOW_RADIUS,
} from '@/features/player/ui/constants';
import { CoverArt } from '@/shared/components/media/ui';
import Colors from '@/shared/theme/colors';
import { Spacing } from '@/shared/theme/spacing';

const p = Colors.palette;

export const PlayerArtwork = memo(function PlayerArtwork({ coverArtId, size }: { coverArtId?: string; size: number }) {
  return (
    <View style={styles.artContainer}>
      <View style={styles.artShadow}>
        <CoverArt coverArtId={coverArtId} size={size} borderRadius={20} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  artContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  artShadow: {
    shadowColor: p.black,
    shadowOffset: { width: 0, height: ART_SHADOW_OFFSET_Y },
    shadowOpacity: ART_SHADOW_OPACITY,
    shadowRadius: ART_SHADOW_RADIUS,
    elevation: ART_SHADOW_ELEVATION,
  },
});
