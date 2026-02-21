export const Spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  smd: 10,
  md: 12,
  mlg: 14,
  lg: 16,
  xlg: 18,
  xl: 20,
  '2xl': 22,
  xxl: 24,
  '3xl': 28,
  xxxl: 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const SCREEN_PADDING_H = Spacing.xl;
export const CONTENT_GAP = Spacing.md;
export const SECTION_PADDING = Spacing.lg;
export const SCROLL_BOTTOM_INSET = 100;

// Header offsets (topPadding + N)
export const HEADER_TOP_GAP_SM = Spacing.sm; // 8
export const HEADER_TOP_GAP_MD = Spacing.md; // 12
export const HEADER_TOP_GAP_LG = Spacing.lg; // 16
export const HEADER_TOP_GAP_XL = Spacing['4xl']; // 40
export const WEB_HEADER_OFFSET = 67;

// Touch & button sizing
export const MIN_TOUCH_TARGET = 44;
export const ICON_BUTTON_SIZE = Spacing['4xl']; // 40
export const ICON_BUTTON_RADIUS = 20;

// Art sizing
export const DETAIL_ART_MARGIN = Spacing['4xl']; // 40 per side
export const PLAYER_ART_MARGIN = Spacing.xxxl; // 32 per side
export const PLAYER_ART_MAX = 380;

// List item heights (getItemLayout)
export const BOOKMARK_ITEM_HEIGHT = 72;
export const GENRE_ITEM_HEIGHT = 52;
export const PLAYLIST_ITEM_HEIGHT = 76;

// Misc layout
export const CATEGORY_ROW_HEIGHT = 56;
export const SEARCH_INPUT_HEIGHT = MIN_TOUCH_TARGET;
export const SWIPE_ACTION_WIDTH = 80;
