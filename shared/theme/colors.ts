const palette = {
  black: '#1A1B26',
  blackLight: '#16161E',
  surface: '#292E42',
  surfaceLight: '#16161E',
  surfaceHighlight: '#414868',
  border: '#3B4261',
  textPrimary: '#C0CAF5',
  textSecondary: '#A9B1D6',
  textTertiary: '#565F89',
  accent: '#7AA2F7',
  accentLight: '#89DDFF',
  accentDark: '#3D59A1',
  danger: '#F7768E',
  success: '#9ECE6A',
  white: '#C0CAF5',
  overlay: 'rgba(26,27,38,0.72)',
  shimmer: '#292E42',
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
