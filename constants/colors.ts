const palette = {
  black: '#0A0A0A',
  blackLight: '#121214',
  surface: '#1A1A1E',
  surfaceLight: '#242428',
  surfaceHighlight: '#2E2E34',
  border: '#333338',
  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1A6',
  textTertiary: '#6E6E73',
  accent: '#D4A053',
  accentLight: '#E8C47A',
  accentDark: '#B8863A',
  danger: '#FF453A',
  success: '#30D158',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
  shimmer: '#2A2A2E',
};

const Colors = {
  light: {
    text: palette.textPrimary,
    background: palette.black,
    tint: palette.accent,
    tabIconDefault: palette.textTertiary,
    tabIconSelected: palette.accent,
  },
  palette,
};

export default Colors;
