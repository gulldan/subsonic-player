import { mock } from 'bun:test';

// Define __DEV__ for expo modules
// @ts-expect-error global __DEV__ used by expo
globalThis.__DEV__ = false;

// Mock native modules that cannot run outside React Native runtime
mock.module('expo-haptics', () => ({
  impactAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
