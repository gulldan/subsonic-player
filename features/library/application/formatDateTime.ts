export function formatDateTime(value?: string | number): string {
  if (value === undefined || value === null) return '-';
  const parsed = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}
