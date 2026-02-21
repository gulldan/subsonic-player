import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  PLAYER_ACCENT,
  PLAYER_CONTROL_SURFACE,
  PLAYER_CONTROL_SURFACE_ACTIVE,
  PLAYER_SECONDARY_BTN,
} from '@/features/player/ui/constants';
import Colors from '@/shared/theme/colors';
import { Spacing } from '@/shared/theme/spacing';

const p = Colors.palette;

export interface PlayerSecondaryAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  activeBackgroundColor?: string;
  accessibilityLabel?: string;
  onPress: () => void;
}

export const PlayerSecondaryActions = memo(function PlayerSecondaryActions({
  actions,
}: {
  actions: PlayerSecondaryAction[];
}) {
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
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={[styles.bottomBtn, action.active && activeStyle]}
            accessibilityLabel={action.accessibilityLabel ?? action.key}
            accessibilityRole="button"
          >
            <Ionicons name={action.icon} size={22} color={iconColor} />
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  bottomBtn: {
    width: PLAYER_SECONDARY_BTN,
    height: PLAYER_SECONDARY_BTN,
    borderRadius: PLAYER_SECONDARY_BTN / 2,
    backgroundColor: PLAYER_CONTROL_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnActive: {
    backgroundColor: PLAYER_CONTROL_SURFACE_ACTIVE,
  },
});
