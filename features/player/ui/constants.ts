import Colors from '@/shared/theme/colors';

const p = Colors.palette;

function toRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const base =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;
  const int = Number.parseInt(base, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export const PLAYER_ACCENT = p.accent;
export const PLAYER_ACCENT_GLOW = toRgba(p.accent, 0.24);
export const PLAYER_GRADIENT = [p.surface, p.surfaceLight, p.blackLight] as const;
export const MINI_PLAYER_GRADIENT = [p.surfaceLight, p.surface] as const;
export const PLAYER_CONTROL_SURFACE = toRgba(p.textPrimary, 0.08);
export const PLAYER_CONTROL_SURFACE_ACTIVE = toRgba(p.accent, 0.2);
export const PLAYER_PROGRESS_TRACK = toRgba(p.textPrimary, 0.22);
export const PLAYER_MUTED_TEXT = p.textSecondary;
export const PLAYER_TOP_BAR_SURFACE = toRgba(p.textPrimary, 0.1);
export const PLAYER_ERROR_SURFACE = toRgba(p.danger, 0.2);
export const PLAYER_SHADOW = toRgba(p.black, 0.55);

// Player sizing tokens
export const PLAYER_MODE_BTN = 40;
export const PLAYER_CONTROL_BTN = 52;
export const PLAYER_PLAY_BTN = 78;
export const PLAYER_SECONDARY_BTN = 48;
export const MINI_PLAYER_BTN = 36;
export const MINI_PROGRESS_HEIGHT = 3;
export const SLIDER_THUMB = 14;
export const SLIDER_TRACK = 5;
export const SLIDER_TOUCH = 36;
export const REPEAT_BADGE = 14;
export const ART_SHADOW_OFFSET_Y = 20;
export const ART_SHADOW_RADIUS = 28;
export const ART_SHADOW_OPACITY = 0.35;
export const ART_SHADOW_ELEVATION = 18;
export const PLAYER_GLOW_INSET = '15%';
export const PLAYER_GLOW_HEIGHT = 260;
