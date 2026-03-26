export interface SubscriptionStatus {
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  currentPeriodEnd: string | null;
  isActive: boolean;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedStatus: { data: SubscriptionStatus; ts: number } | null = null;

const defaultStatus: SubscriptionStatus = {
  plan: 'free',
  status: 'none',
  currentPeriodEnd: null,
  isActive: false,
};

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  // Check memory cache first
  if (cachedStatus && Date.now() - cachedStatus.ts < CACHE_TTL) {
    return cachedStatus.data;
  }

  try {
    const { getUserSubscription } = await import('./supabaseService');
    const data = await getUserSubscription(userId);

    if (!data) {
      return defaultStatus;
    }

    const isActive = data.status === 'active' || data.status === 'trialing';
    const result: SubscriptionStatus = {
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      isActive,
    };

    cachedStatus = { data: result, ts: Date.now() };
    return result;
  } catch {
    return defaultStatus;
  }
};

export const clearSubscriptionCache = (): void => {
  cachedStatus = null;
};

export const startCheckout = async (params: {
  priceId: string;
  userId: string;
  email: string;
}): Promise<void> => {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: params.priceId,
      userId: params.userId,
      email: params.email,
      successUrl: `${window.location.origin}/?checkout=success`,
      cancelUrl: `${window.location.origin}/?checkout=canceled`,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errBody.error || 'Checkout failed');
  }

  const { url } = await res.json();
  if (url) {
    window.location.href = url;
  }
};

export const openBillingPortal = async (userId: string): Promise<void> => {
  const res = await fetch('/api/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errBody.error || 'Failed to open billing portal');
  }

  const { url } = await res.json();
  if (url) {
    window.location.href = url;
  }
};

// Plan limits
export const FREE_DAILY_LIMIT = 3;
export const PRO_DAILY_LIMIT = 999;
export const TEAM_DAILY_LIMIT = 999;
export const TEAM_MAX_SEATS = 25;

export const getEffectiveDailyLimit = (subscription: SubscriptionStatus): number => {
  if (!subscription.isActive) return FREE_DAILY_LIMIT;
  return subscription.plan === 'team' ? TEAM_DAILY_LIMIT : PRO_DAILY_LIMIT;
};

export const canCreateTeamWorkspace = (subscription: SubscriptionStatus): boolean => {
  return subscription.isActive && subscription.plan === 'team';
};
