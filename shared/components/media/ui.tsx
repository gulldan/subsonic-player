import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useEffect, useState } from 'react';
import {
  type DimensionValue,
  PixelRatio,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Album, Artist, Song } from '@/shared/api/subsonic/types';
import { useCoverArtUrl } from '@/shared/components/media/CoverArtContext';
import Colors from '@/shared/theme/colors';
import { CONTENT_GAP, SCREEN_PADDING_H, Spacing } from '@/shared/theme/spacing';

const p = Colors.palette;

const PRESSED_ROW = { opacity: 0.6 } as const;
const PRESSED_CARD = { opacity: 0.7 } as const;

export function formatDuration(value: number, inSeconds?: boolean): string {
  const totalSeconds = inSeconds ? Math.floor(value) : Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

export const CoverArt = memo(function CoverArt({
  coverArtId,
  size,
  borderRadius = 8,
}: {
  coverArtId?: string;
  size: number;
  borderRadius?: number;
}) {
  const getCoverArtUrl = useCoverArtUrl();
  const [hasError, setHasError] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset error state when coverArtId prop changes
  useEffect(() => {
    setHasError(false);
  }, [coverArtId]);

  const requestSize = Math.ceil(size * PixelRatio.get());
  const url = coverArtId && getCoverArtUrl ? getCoverArtUrl(coverArtId, requestSize) : null;

  if (!url || hasError) {
    return (
      <View style={[styles.coverPlaceholder, { width: size, height: size, borderRadius }]}>
        <Ionicons name="musical-notes" size={size * 0.4} color={p.textTertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      onError={() => setHasError(true)}
    />
  );
});

export const TrackItem = memo(function TrackItem({
  song,
  index,
  onPress,
  showArt = false,
  isActive = false,
  onLongPress,
}: {
  song: Song;
  index?: number;
  onPress: (song: Song) => void;
  showArt?: boolean;
  isActive?: boolean;
  onLongPress?: (song: Song) => void;
}) {
  const durationText = song.duration ? formatDuration(song.duration, true) : '';

  return (
    <Pressable
      onPress={() => onPress(song)}
      onLongPress={onLongPress ? () => onLongPress(song) : undefined}
      hitSlop={4}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.trackRow, pressed && PRESSED_ROW]}
      accessibilityLabel={`${song.title} by ${song.artist ?? 'unknown artist'}`}
      accessibilityRole="button"
    >
      {showArt ? (
        <CoverArt coverArtId={song.coverArt} size={40} borderRadius={6} />
      ) : (
        index != null && <Text style={styles.trackIndex}>{index}</Text>
      )}
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, isActive && styles.trackTitleActive]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {song.artist ?? ''}
        </Text>
      </View>
      {durationText ? <Text style={styles.trackDuration}>{durationText}</Text> : null}
    </Pressable>
  );
});

export const TrackList = memo(function TrackList({
  songs,
  onPress,
  showArt = false,
  isActiveTrackId,
  useIndexInKey = false,
}: {
  songs: Song[];
  onPress: (song: Song) => void;
  showArt?: boolean;
  isActiveTrackId?: string | null;
  useIndexInKey?: boolean;
}) {
  return (
    <>
      {songs.map((song, i) => (
        <TrackItem
          key={useIndexInKey ? `${song.id}-${i}` : song.id}
          song={song}
          index={i + 1}
          onPress={onPress}
          showArt={showArt}
          isActive={isActiveTrackId === song.id}
        />
      ))}
    </>
  );
});

export function AlbumCard({
  album,
  onPress,
  size = 160,
}: {
  album: Album;
  onPress: (album: Album) => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={() => onPress(album)}
      style={({ pressed }) => [{ width: size }, pressed && PRESSED_CARD]}
      accessibilityLabel={`${album.name} by ${album.artist ?? 'unknown artist'}`}
      accessibilityRole="button"
    >
      <CoverArt coverArtId={album.coverArt} size={size} borderRadius={12} />
      <Text style={styles.albumName} numberOfLines={2}>
        {album.name}
      </Text>
      <Text style={styles.albumArtist} numberOfLines={1}>
        {album.artist ?? ''}
      </Text>
    </Pressable>
  );
}

export function ArtistCard({ artist, onPress }: { artist: Artist; onPress: (artist: Artist) => void }) {
  return (
    <Pressable
      onPress={() => onPress(artist)}
      style={({ pressed }) => [styles.artistCard, pressed && PRESSED_CARD]}
      accessibilityLabel={artist.name}
      accessibilityRole="button"
    >
      <CoverArt coverArtId={artist.coverArt} size={80} borderRadius={40} />
      <Text style={styles.artistName} numberOfLines={1}>
        {artist.name}
      </Text>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  onSeeAll,
  seeAllText = 'See All',
}: {
  title: string;
  onSeeAll?: () => void;
  seeAllText?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} accessibilityLabel={`${seeAllText} ${title}`} accessibilityRole="button">
          <Text style={styles.seeAllText}>{seeAllText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Shimmer({
  width,
  height,
  borderRadius = 0,
  style,
}: {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: p.shimmer,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={48} color={p.textTertiary} />
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coverPlaceholder: {
    backgroundColor: p.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    gap: CONTENT_GAP,
  },
  trackIndex: {
    width: 28,
    textAlign: 'center',
    color: p.textTertiary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    color: p.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  trackTitleActive: {
    color: p.accent,
  },
  trackArtist: {
    color: p.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  trackDuration: {
    color: p.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  albumName: {
    color: p.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: Spacing.sm,
  },
  albumArtist: {
    color: p.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  artistCard: {
    alignItems: 'center',
    width: 90,
  },
  artistName: {
    color: p.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    marginBottom: CONTENT_GAP,
  },
  sectionTitle: {
    color: p.white,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  seeAllText: {
    color: p.accent,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: CONTENT_GAP,
    padding: Spacing.xxxl,
  },
  emptyMessage: {
    color: p.textTertiary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
