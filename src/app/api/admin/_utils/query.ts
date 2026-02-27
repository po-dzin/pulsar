const toNumber = (raw: string | null): number | null => {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : null;
};

export const parseClampedInt = (
  raw: string | null,
  { fallback, min, max }: { fallback: number; min: number; max: number }
): number => {
  const value = toNumber(raw) ?? fallback;
  return Math.min(max, Math.max(min, value));
};
