/** Equivalent of Angular's `number` pipe digit spec: "minInt.minFrac-maxFrac" (e.g. '1.2-2'). */
export function formatNumber(value: number | null | undefined, digits = '1.0-3'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const match = /^(\d+)\.(\d+)-(\d+)$/.exec(digits);
  const [minInt, minFrac, maxFrac] = match ? [+match[1], +match[2], +match[3]] : [1, 0, 3];
  return value.toLocaleString('en-US', {
    minimumIntegerDigits: minInt,
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  });
}

type DateInput = Date | string | number | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Equivalent of Angular's `date` pipe for the formats used in this app. */
export function formatDate(value: DateInput, format: 'short' | 'shortTime' | 'medium' = 'short'): string {
  const date = toDate(value);
  if (!date) return '';
  switch (format) {
    case 'shortTime':
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    case 'medium':
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    default:
      return date.toLocaleString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
