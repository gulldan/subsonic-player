export function mapLoadError(error: unknown): string {
  const message = String((error as any)?.message ?? error ?? '');
  if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
    return 'Server rate limit reached. Try again shortly.';
  }
  if (message.includes('401') || message.includes('403')) {
    return 'Authentication error. Please re-login.';
  }
  return 'Could not load track. Tap to retry.';
}
