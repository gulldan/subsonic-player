import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PLAYER_MUTED_TEXT } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';
import { Spacing } from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

interface PlayerTrackInfoProps {
  title: string;
  artist?: string;
  album?: string;
}

export const PlayerTrackInfo = memo(function PlayerTrackInfo({ title, artist, album }: PlayerTrackInfoProps) {
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
});

const styles = StyleSheet.create({
  trackInfoSection: {
    paddingHorizontal: Spacing.xxxl,
    marginTop: Spacing.mlg,
    marginBottom: Spacing.sm,
  },
  trackTitle: {
    fontSize: FontSize.display,
    fontFamily: 'Inter_700Bold',
    color: p.white,
    marginBottom: Spacing['2xs'],
  },
  trackArtist: {
    fontSize: FontSize.subtitle,
    fontFamily: 'Inter_500Medium',
    color: p.white,
    opacity: 0.9,
  },
  trackAlbum: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: PLAYER_MUTED_TEXT,
    marginTop: Spacing.xs,
  },
});
