// lib/rate-limit.ts

const ipCache = new Map<string, number[]>();

// Clean up stale entries to prevent memory leaks
if (typeof global !== "undefined") {
  const intervalKey = "_rate_limit_cleanup_interval";
  if (!(global as any)[intervalKey]) {
    (global as any)[intervalKey] = setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamps] of ipCache.entries()) {
        const active = timestamps.filter((time) => now - time < 10 * 60 * 1000); // 10 min window max
        if (active.length === 0) {
          ipCache.delete(ip);
        } else {
          ipCache.set(ip, active);
        }
      }
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }
}

/**
 * Checks if a given IP exceeds the limit of requests within a sliding window.
 * @param ip Client IP address
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds
 * @returns true if rate limited, false otherwise
 */
export function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = ipCache.get(ip) || [];

  // Filter out timestamps outside the sliding window
  const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

  if (activeTimestamps.length >= limit) {
    return true;
  }

  activeTimestamps.push(now);
  ipCache.set(ip, activeTimestamps);
  return false;
}
