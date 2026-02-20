import { describe, expect, mock, test } from 'bun:test';

// Mock native dependencies before importing
mock.module('react-native', () => ({
  ActivityIndicator: () => null,
  Platform: { OS: 'ios' },
  PixelRatio: { get: () => 2 },
  Pressable: () => null,
  StyleSheet: { create: (s: any) => s },
  Text: () => null,
  View: () => null,
}));
mock.module('react-native-reanimated', () => ({
  default: { View: () => null },
  SlideInDown: { duration: () => ({}) },
  useAnimatedStyle: () => ({}),
  useSharedValue: () => ({ value: 0 }),
  withRepeat: () => 0,
  withSequence: () => 0,
  withTiming: () => 0,
}));
mock.module('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
mock.module('expo-image', () => ({
  Image: () => null,
}));
mock.module('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}));
mock.module('expo-haptics', () => ({
  impactAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light' },
}));
mock.module('@tanstack/react-query', () => ({
  useQueryClient: () => ({}),
}));
mock.module('@/shared/theme/colors', () => ({
  default: { palette: {} },
}));
mock.module('@/features/auth/contexts/AuthContext', () => ({
  useAuth: () => ({ client: null }),
}));
mock.module('@/features/player/core/presentation/PlayerProvider', () => ({
  usePlayer: () => ({}),
  usePlayerPosition: () => 0,
}));

const { formatDuration } = await import('../ui');

describe('formatDuration', () => {
  describe('milliseconds (default)', () => {
    test('formats seconds only', () => {
      expect(formatDuration(30_000)).toBe('0:30');
    });

    test('formats minutes and seconds', () => {
      expect(formatDuration(195_000)).toBe('3:15');
    });

    test('pads seconds with leading zero', () => {
      expect(formatDuration(60_000)).toBe('1:00');
      expect(formatDuration(65_000)).toBe('1:05');
    });

    test('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3_723_000)).toBe('1:02:03');
    });

    test('pads minutes with leading zero when hours present', () => {
      expect(formatDuration(3_600_000)).toBe('1:00:00');
    });

    test('zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });
  });

  describe('inSeconds flag', () => {
    test('treats value as seconds', () => {
      expect(formatDuration(30, true)).toBe('0:30');
    });

    test('formats minutes and seconds', () => {
      expect(formatDuration(195, true)).toBe('3:15');
    });

    test('formats hours', () => {
      expect(formatDuration(3723, true)).toBe('1:02:03');
    });

    test('zero', () => {
      expect(formatDuration(0, true)).toBe('0:00');
    });
  });
});
