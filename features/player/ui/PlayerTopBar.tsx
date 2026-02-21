import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PLAYER_MUTED_TEXT, PLAYER_TOP_BAR_SURFACE } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';
import { ICON_BUTTON_RADIUS, ICON_BUTTON_SIZE, Spacing } from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;
const SPACER_40 = { width: ICON_BUTTON_SIZE } as const;

export const PlayerTopBar = memo(function PlayerTopBar({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close player" accessibilityRole="button">
        <Ionicons name="chevron-down" size={28} color={p.white} />
      </Pressable>
      <Text style={styles.nowPlaying}>Now Playing</Text>
      <View style={SPACER_40} />
    </View>
  );
});

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.mlg,
    marginBottom: Spacing.xlg,
  },
  closeBtn: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_RADIUS,
    backgroundColor: PLAYER_TOP_BAR_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlaying: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: PLAYER_MUTED_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
