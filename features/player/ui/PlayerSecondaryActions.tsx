import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { PLAYER_ACCENT, PLAYER_CONTROL_SURFACE, PLAYER_CONTROL_SURFACE_ACTIVE } from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';

const p = Colors.palette;

export interface PlayerSecondaryAction {
  key: string;
  icon: string;
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  activeBackgroundColor?: string;
  onPress: () => void;
}

export function PlayerSecondaryActions({ actions }: { actions: PlayerSecondaryAction[] }) {
  if (actions.length === 0) return null;

  return (
    <View style={styles.bottomRow}>
      {actions.map((action) => {
        const iconColor = action.active
          ? (action.activeColor ?? PLAYER_ACCENT)
          : (action.inactiveColor ?? p.textTertiary);
        const activeStyle = [
          styles.bottomBtnActive,
          action.activeBackgroundColor ? { backgroundColor: action.activeBackgroundColor } : null,
        ];

        return (
          <Pressable key={action.key} onPress={action.onPress} style={[styles.bottomBtn, action.active && activeStyle]}>
            <Ionicons name={action.icon as any} size={22} color={iconColor} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  bottomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PLAYER_CONTROL_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnActive: {
    backgroundColor: PLAYER_CONTROL_SURFACE_ACTIVE,
  },
});
