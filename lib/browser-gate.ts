/**
 * lib/browser-gate.ts
 *
 * Client-side browser gate helper for /voting page only.
 * Blocks voting interactions for:
 * 1. Brave browser (any mode) via navigator.brave.isBrave()
 * 2. Safari in Private Browsing mode via storage quota detection heuristic
 *
 * Note: Safari Private Browsing detection methods may need revisiting over time
 * as WebKit / Apple periodically update private browsing storage behaviors.
 */

export type BlockedReason = "brave" | "safari_private";

export interface BrowserGateResult {
  isBlocked: boolean;
  reason?: BlockedReason;
  message?: string;
}

declare global {
  interface Navigator {
    brave?: {
      isBrave: () => Promise<boolean>;
    };
  }
}

/**
 * Detects if the client User-Agent is Safari (iOS or macOS Safari)
 */
function isSafariBrowser(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  const ua = navigator.userAgent;
  // Matches Safari on iOS/macOS, excluding Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS), and Android
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android|OPR|Opera/i.test(ua);
  return isSafari;
}

/**
 * Best-effort detection heuristic for Safari Private Browsing mode.
 * In Safari Private Browsing, navigator.storage.estimate() reports quota as 0 or <= 120MB,
 * whereas non-private Safari reports gigabytes of quota.
 */
async function isSafariPrivateBrowsing(): Promise<boolean> {
  if (!isSafariBrowser()) return false;

  try {
    // 1. Storage quota estimate check
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      // In Safari Private Browsing, quota is capped at 0 or 120,000,000 bytes (~120MB).
      // In regular Safari, quota is typically > 1,000,000,000 bytes (1GB+).
      if (quota <= 120000000) {
        return true;
      }
    }

    // 2. Fallback check: IndexedDB open test (for older iOS Safari private mode behavior)
    try {
      const dbRequest = indexedDB.open("bmaa_pv_test");
      let isPrivate = false;
      dbRequest.onerror = () => {
        isPrivate = true;
      };
      if (isPrivate) return true;
    } catch {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Checks if the browser is Brave using Brave's official JS API
 */
async function isBraveBrowser(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator) return false;
  try {
    if (navigator.brave && typeof navigator.brave.isBrave === "function") {
      return await navigator.brave.isBrave();
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Primary browser gate check executed on /voting page load
 */
export async function checkBrowserGate(): Promise<BrowserGateResult> {
  if (typeof window === "undefined") {
    return { isBlocked: false };
  }

  // 1. Check Brave browser (all modes)
  if (await isBraveBrowser()) {
    return {
      isBlocked: true,
      reason: "brave",
      message:
        "Voting isn't available in Brave browser. Please switch to Chrome, Edge, or regular Safari browsing to vote.",
    };
  }

  // 2. Check Safari Private Browsing mode
  if (await isSafariPrivateBrowsing()) {
    return {
      isBlocked: true,
      reason: "safari_private",
      message:
        "Voting isn't available in Safari Private Browsing. Please switch to Chrome, Edge, or regular Safari browsing to vote.",
    };
  }

  return { isBlocked: false };
}
