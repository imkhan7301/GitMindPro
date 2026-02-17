/**
 * Rate limiting and quota management
 */

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

class RateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isAllowed(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.config.maxRequests, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / this.config.windowMs) * this.config.maxRequests;
    bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true };
    }

    const retryAfter = Math.ceil(
      (1 - bucket.tokens) * (this.config.windowMs / this.config.maxRequests)
    );

    return { allowed: false, retryAfter };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  resetAll(): void {
    this.buckets.clear();
  }
}

// Singleton instance for API calls
export const apiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000,
});

export { RateLimiter };
export type { RateLimitConfig };
