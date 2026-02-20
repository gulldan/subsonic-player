import { StyleSheet, Text, View } from 'react-native';
import { PLAYER_MUTED_TEXT } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

interface PlayerTrackInfoProps {
  title: string;
  artist?: string;
  album?: string;
}

export function PlayerTrackInfo({ title, artist, album }: PlayerTrackInfoProps) {
  return (
    <View style={styles.trackInfoSection}>
      <Text style={styles.trackTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.trackArtist} numberOfLines={1}>
        {artist ?? ''}
      </Text>
      <Text style={styles.trackAlbum} numberOfLines={1}>
        {album ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trackInfoSection: {
    paddingHorizontal: 32,
    marginTop: 14,
    marginBottom: 8,
  },
  trackTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: p.white,
    opacity: 0.9,
  },
  trackAlbum: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: PLAYER_MUTED_TEXT,
    marginTop: 4,
  },
});
