import { StyleSheet, View } from 'react-native';
import { CoverArt } from '@/shared/components/media/ui';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export function PlayerArtwork({ coverArtId, size }: { coverArtId?: string; size: number }) {
  return (
    <View style={styles.artContainer}>
      <View style={styles.artShadow}>
        <CoverArt coverArtId={coverArtId} size={size} borderRadius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  artContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  artShadow: {
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 18,
  },
});
