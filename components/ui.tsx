import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  SlideInDown,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlayer } from '@/lib/contexts/PlayerContext';
import Colors from '@/constants/colors';
import type { Song, Album, Artist } from '@/lib/api/types';

const p = Colors.palette;

export function formatDuration(
  value: number,
  inSeconds?: boolean
): string {
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

export function CoverArt({
  coverArtId,
  size,
  borderRadius = 8,
}: {
  coverArtId?: string;
  size: number;
  borderRadius?: number;
}) {
  const { client } = useAuth();
  const url = coverArtId && client ? client.getCoverArtUrl(coverArtId, size) : null;

  if (!url) {
    return (
      <View
        style={[
          styles.coverPlaceholder,
          { width: size, height: size, borderRadius },
        ]}
      >
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
    />
  );
}

export function TrackItem({
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
      style={({ pressed }) => [
        styles.trackRow,
        pressed && { opacity: 0.6 },
      ]}
    >
      {showArt ? (
        <CoverArt coverArtId={song.coverArt} size={40} borderRadius={6} />
      ) : index != null ? (
        <Text style={styles.trackIndex}>{index}</Text>
      ) : null}
      <View style={styles.trackInfo}>
        <Text
          style={[
            styles.trackTitle,
            isActive && { color: p.accent },
          ]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {song.artist ?? ''}
        </Text>
      </View>
      {durationText ? (
        <Text style={styles.trackDuration}>{durationText}</Text>
      ) : null}
    </Pressable>
  );
}

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
      style={({ pressed }) => [
        { width: size },
        pressed && { opacity: 0.7 },
      ]}
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

export function ArtistCard({
  artist,
  onPress,
}: {
  artist: Artist;
  onPress: (artist: Artist) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(artist)}
      style={({ pressed }) => [
        styles.artistCard,
        pressed && { opacity: 0.7 },
      ]}
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
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAllText}>{seeAllText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MiniPlayer({ onPress, bottomOffset }: { onPress: () => void; bottomOffset: number }) {
  const { currentTrack, isPlaying, pause, resume, next, position, duration } = usePlayer();
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [isStarred, setIsStarred] = useState(!!currentTrack?.starred);

  useEffect(() => {
    setIsStarred(!!currentTrack?.starred);
  }, [currentTrack?.id, currentTrack?.starred]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const handlePlayPause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await next();
  };

  const handleStar = async () => {
    if (!client || !currentTrack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isStarred) {
        await client.unstar(currentTrack.id);
        setIsStarred(false);
      } else {
        await client.star(currentTrack.id);
        setIsStarred(true);
      }
      queryClient.invalidateQueries({ queryKey: ['starred'] });
    } catch {}
  };

  return (
    <Animated.View entering={SlideInDown.duration(300)} style={[styles.miniPlayer, { bottom: bottomOffset }]}>
      <View style={styles.miniProgressBar}>
        <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable onPress={onPress} style={styles.miniPlayerContent}>
        <CoverArt coverArtId={currentTrack.coverArt} size={48} borderRadius={8} />
        <View style={styles.miniPlayerInfo}>
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.miniPlayerArtist} numberOfLines={1}>{currentTrack.artist ?? ''}</Text>
        </View>
      </Pressable>

      <Pressable onPress={handleStar} style={styles.miniPlayerBtn}>
        <Ionicons name={isStarred ? 'heart' : 'heart-outline'} size={22} color={isStarred ? p.accent : p.textSecondary} />
      </Pressable>

      <Pressable onPress={handlePlayPause} style={styles.miniPlayPauseBtn}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={p.white} />
      </Pressable>

      <Pressable onPress={handleNext} style={styles.miniPlayerBtn}>
        <Ionicons name="play-forward" size={20} color={p.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

export function Shimmer({
  width,
  height,
  borderRadius = 0,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
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

export function EmptyState({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={48} color={p.textTertiary} />
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
    paddingHorizontal: 16,
    gap: 12,
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
    marginTop: 8,
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
    marginTop: 8,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
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
  miniPlayer: {
    position: 'absolute' as const,
    left: 8,
    right: 8,
    height: 64,
    backgroundColor: '#1C1C20',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingRight: 4,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 -2px 20px rgba(0,0,0,0.5)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 16,
    }),
  } as any,
  miniProgressBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniProgressFill: {
    height: 2,
    backgroundColor: p.accent,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayPauseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyMessage: {
    color: p.textTertiary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
