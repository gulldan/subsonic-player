export const VERTICAL_LIST_PROPS = {
  maxToRenderPerBatch: 15,
  initialNumToRender: 10,
  windowSize: 5,
  removeClippedSubviews: true,
} as const;

export const HORIZONTAL_LIST_PROPS = {
  maxToRenderPerBatch: 8,
  initialNumToRender: 5,
  windowSize: 3,
  removeClippedSubviews: true,
} as const;

export const keyExtractorById = (item: { id: string }) => item.id;

import { SCREEN_PADDING_H, SCROLL_BOTTOM_INSET, Spacing } from '@/shared/theme/spacing';

export const createGridContentStyle = (bottomInset: number) => ({
  paddingHorizontal: SCREEN_PADDING_H,
  paddingBottom: bottomInset + SCROLL_BOTTOM_INSET,
  gap: SCREEN_PADDING_H,
});

export const createDetailContentStyle = (topPadding: number, bottomInset: number) => ({
  paddingTop: topPadding + Spacing.lg,
  paddingBottom: bottomInset + SCROLL_BOTTOM_INSET,
});
