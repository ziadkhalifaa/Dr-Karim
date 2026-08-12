// BMI is informational only (spec §0 guardrail). NEVER a routing input.

export function computeBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  const value = w / Math.pow(h / 100, 2);
  return Math.round(value * 100) / 100;
}
