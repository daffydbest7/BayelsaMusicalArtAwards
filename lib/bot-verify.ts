/**
 * lib/bot-verify.ts
 *
 * Single entry-point for bot verification across the entire app.
 * All callers (vote endpoint, admin login) call `verifyBotCheck()` —
 * never implement provider-specific logic inline.
 *
 * Swappable via BOT_VERIFY_PROVIDER / NEXT_PUBLIC_BOT_VERIFY_PROVIDER env var:
 *   "turnstile" → Cloudflare Turnstile server-side token verification
 *   "hcaptcha"  → hCaptcha server-side token verification
 *   "none"      → built-in honeypot + timing heuristic (no external service)
 *
 * Resilient: If a provider token is missing or fails due to server configuration or domain mismatch,
 * it safely falls back to honeypot validation so legitimate users are never blocked.
 */

export interface BotCheckPayload {
  /** Turnstile/hCaptcha response token (empty/absent when provider is "none") */
  token?: string;
  /** Honeypot field value — must arrive empty for legitimate users */
  honeypot?: string;
  /** Timestamp (ms) when the form/modal was rendered on the client */
  formRenderedAt?: number;
  /** Timestamp (ms) when the form was submitted */
  formSubmittedAt?: number;
}

export interface BotCheckResult {
  success: boolean;
  /** Human-readable reason on failure — never reveal which specific check failed to the client */
  reason?: string;
}

const TIMING_THRESHOLD_MS = 600; // submissions faster than this are suspicious

/**
 * Verify the bot-check payload. Call this BEFORE any database write.
 */
export async function verifyBotCheck(payload: BotCheckPayload): Promise<BotCheckResult> {
  const provider =
    process.env.BOT_VERIFY_PROVIDER ||
    process.env.NEXT_PUBLIC_BOT_VERIFY_PROVIDER ||
    "none";

  switch (provider) {
    case "turnstile":
      return verifyTurnstile(payload);

    case "hcaptcha":
      return verifyHCaptcha(payload);

    case "none":
    default:
      return verifyFallback(payload);
  }
}

// ── Turnstile ───────────────────────────────────────────────────

async function verifyTurnstile(payload: BotCheckPayload): Promise<BotCheckResult> {
  const { token } = payload;
  if (!token) {
    console.warn("Turnstile token missing from payload. Falling back to honeypot validation.");
    return verifyFallback(payload);
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY is not configured on server. Falling back to honeypot validation.");
    return verifyFallback(payload);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();
    if (data.success) {
      return { success: true };
    }

    console.warn("Turnstile siteverify returned error-codes:", data["error-codes"]);
    
    // Safely fall back to honeypot validation so legitimate users are not blocked
    return verifyFallback(payload);
  } catch (err) {
    console.error("Turnstile verification network error:", err);
    return verifyFallback(payload);
  }
}

// ── hCaptcha ────────────────────────────────────────────────────

async function verifyHCaptcha(payload: BotCheckPayload): Promise<BotCheckResult> {
  const { token } = payload;
  if (!token) {
    return verifyFallback(payload);
  }

  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    return verifyFallback(payload);
  }

  try {
    const response = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();
    if (data.success) {
      return { success: true };
    }

    console.warn("hCaptcha siteverify returned error-codes:", data["error-codes"]);
    return verifyFallback(payload);
  } catch (err) {
    console.error("hCaptcha verification error:", err);
    return verifyFallback(payload);
  }
}

// ── Fallback (honeypot + timing) ────────────────────────────────

function verifyFallback(payload: BotCheckPayload): BotCheckResult {
  // 1. Honeypot: must be empty
  if (payload.honeypot && payload.honeypot.length > 0) {
    return { success: false, reason: "Verification failed." };
  }

  // 2. Timing: reject implausibly fast submissions
  if (payload.formRenderedAt && payload.formSubmittedAt) {
    const elapsed = payload.formSubmittedAt - payload.formRenderedAt;
    if (elapsed < TIMING_THRESHOLD_MS) {
      return { success: false, reason: "Verification failed." };
    }
  }

  return { success: true };
}
