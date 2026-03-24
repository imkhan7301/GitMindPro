/**
 * Free Tier Management
 * Handles non-authenticated user analysis quota (localStorage-based)
 */

const FREE_TIER_KEY = 'gitmind_free_tier';
const FREE_TIER_LIMIT = 3;

interface FreeTierData {
  count: number;
  lastReset: string; // ISO date string
}

export const getFreeTierData = (): FreeTierData => {
  const data = localStorage.getItem(FREE_TIER_KEY);
  if (!data) {
    return { count: 0, lastReset: new Date().toISOString() };
  }

  try {
    const parsed = JSON.parse(data) as FreeTierData;
    const lastReset = new Date(parsed.lastReset);
    const now = new Date();

    // Reset if it's been 24 hours
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      return { count: 0, lastReset: now.toISOString() };
    }

    return parsed;
  } catch {
    return { count: 0, lastReset: new Date().toISOString() };
  }
};

export const incrementFreeTierCount = (): { used: number; remaining: number; limit: number } => {
  const data = getFreeTierData();
  const updated = { count: data.count + 1, lastReset: data.lastReset };
  localStorage.setItem(FREE_TIER_KEY, JSON.stringify(updated));
  return {
    used: updated.count,
    remaining: Math.max(0, FREE_TIER_LIMIT - updated.count),
    limit: FREE_TIER_LIMIT
  };
};

export const canUseFreeTier = (): boolean => {
  const data = getFreeTierData();
  return data.count < FREE_TIER_LIMIT;
};

export const getFreeTierRemaining = (): number => {
  const data = getFreeTierData();
  return Math.max(0, FREE_TIER_LIMIT - data.count);
};

export const getFreeTierStatus = (): { used: number; remaining: number; limit: number } => {
  const data = getFreeTierData();
  return {
    used: data.count,
    remaining: Math.max(0, FREE_TIER_LIMIT - data.count),
    limit: FREE_TIER_LIMIT
  };
};

export const resetFreeTierCount = (): void => {
  localStorage.removeItem(FREE_TIER_KEY);
};
