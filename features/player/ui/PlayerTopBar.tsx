import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PLAYER_MUTED_TEXT, PLAYER_TOP_BAR_SURFACE } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;
const SPACER_40 = { width: 40 } as const;

export function PlayerTopBar({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="chevron-down" size={28} color={p.white} />
      </Pressable>
      <Text style={styles.nowPlaying}>Now Playing</Text>
      <View style={SPACER_40} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PLAYER_TOP_BAR_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlaying: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: PLAYER_MUTED_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
