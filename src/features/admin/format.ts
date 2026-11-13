export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '')
    return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (!value.length) return 'None listed';
    if (value.some(item => typeof item === 'object' && item !== null))
      return JSON.stringify(value, null, 2);
    return value.map(formatValue).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function formatDate(value: string | null): string {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function matchesSite(name: string, query: string): boolean {
  return name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
