import * as Haptics from 'expo-haptics';

export async function runWithLightHaptic<TResult>(action: () => TResult | Promise<TResult>) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  return action();
}
