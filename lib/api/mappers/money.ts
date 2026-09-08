/** Money helpers — backend uses integer minor units; Admin UI uses decimal dollars. */

export function dollarsToMinor(dollars: number): number {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function minorToDollars(minor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return minor / 100;
}

export function slugifyAscii(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `item-${Date.now()}`
  );
}
