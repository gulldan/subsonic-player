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
