interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private storage: Map<string, Map<string, RateLimitInfo>>;
  private limits: RateLimitConfig[];

  constructor() {
    this.storage = new Map();
    this.limits = [
      { windowMs: 60 * 1000, maxRequests: 15 },        // 15 requests per minute
      { windowMs: 60 * 60 * 1000, maxRequests: 250 },  // 250 requests per hour
      { windowMs: 24 * 60 * 60 * 1000, maxRequests: 500 } // 500 requests per day
    ];
  }

  private getKey(identifier: string, windowMs: number): string {
    return `${identifier}:${windowMs}`;
  }

  private getCurrentWindow(windowMs: number): number {
    return Math.floor(Date.now() / windowMs);
  }

  check(identifier: string): { allowed: boolean; resetAt?: number } {
    if (!this.storage.has(identifier)) {
      this.storage.set(identifier, new Map());
    }

    const userLimits = this.storage.get(identifier)!;
    const now = Date.now();

    // Check all time windows
    for (const limit of this.limits) {
      const key = this.getKey(identifier, limit.windowMs);
      const currentWindow = this.getCurrentWindow(limit.windowMs);
      const windowReset = (currentWindow + 1) * limit.windowMs;

      let limitInfo = userLimits.get(key);

      // Clean up expired window
      if (!limitInfo || limitInfo.resetAt <= now) {
        limitInfo = { count: 0, resetAt: windowReset };
      }

      // Check if limit is exceeded
      if (limitInfo.count >= limit.maxRequests) {
        return { allowed: false, resetAt: limitInfo.resetAt };
      }

      // Update count
      limitInfo.count++;
      userLimits.set(key, limitInfo);
    }

    return { allowed: true };
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, userLimits] of this.storage.entries()) {
      for (const [key, limitInfo] of userLimits.entries()) {
        if (limitInfo.resetAt <= now) {
          userLimits.delete(key);
        }
      }
      if (userLimits.size === 0) {
        this.storage.delete(identifier);
      }
    }
  }
} 