export type LoyaltyTier = 'silver' | 'gold' | 'platinum';

export interface TierInfo {
  tier: LoyaltyTier;
  label: string;
  gradient: string;
  nextMin: number | null;
}

const TIERS: { tier: LoyaltyTier; label: string; min: number; gradient: string }[] = [
  { tier: 'silver',   label: 'Silver',   min: 0,   gradient: 'linear-gradient(135deg,#9ca3af,#6b7280)' },
  { tier: 'gold',     label: 'Gold',     min: 200, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { tier: 'platinum', label: 'Platinum', min: 500, gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
];

export function getTierInfo(xp: number): TierInfo {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (xp >= t.min) current = t;
  }
  const idx = TIERS.findIndex((t) => t.tier === current.tier);
  const next = TIERS[idx + 1] ?? null;
  return { ...current, nextMin: next?.min ?? null };
}

/** Progress ratio (0–1) toward the next tier. Returns 1 at max tier. */
export function tierProgress(xp: number): number {
  const info = getTierInfo(xp);
  if (!info.nextMin) return 1;
  const base = TIERS.find((t) => t.tier === info.tier)!.min;
  return Math.min((xp - base) / (info.nextMin - base), 1);
}

/** XP earned from an order: 1% of total amount, rounded down. */
export function xpFromOrder(totalAmount: number): number {
  return Math.floor(totalAmount * 0.01);
}
