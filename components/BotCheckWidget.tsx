"use client";

/**
 * BotCheckWidget
 *
 * Renders the appropriate bot-verification UI based on BOT_VERIFY_PROVIDER:
 * - "turnstile" → Cloudflare Turnstile widget (via script tag)
 * - "hcaptcha"  → hCaptcha widget (via script tag)
 * - "none"      → Hidden honeypot field + timing data (no visible UI)
 *
 * Parent form reads the collected data via the `onVerify` callback.
 */

import { useEffect, useRef, useState } from "react";

export interface BotCheckData {
  token?: string;
  honeypot?: string;
  formRenderedAt?: number;
  formSubmittedAt?: number;
}

interface BotCheckWidgetProps {
  /** Called whenever the verification data changes */
  onVerify: (data: BotCheckData) => void;
}

// Read the provider at module level (NEXT_PUBLIC_ prefix so it's available client-side)
const PROVIDER = process.env.NEXT_PUBLIC_BOT_VERIFY_PROVIDER || "none";

export function BotCheckWidget({ onVerify }: BotCheckWidgetProps) {
  const [honeypot, setHoneypot] = useState("");
  const [renderTime] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // For the fallback provider, update the parent on every change
  useEffect(() => {
    if (PROVIDER === "none") {
      onVerify({
        honeypot,
        formRenderedAt: renderTime,
        formSubmittedAt: Date.now(), // will be re-read at actual submit time
      });
    }
  }, [honeypot, renderTime, onVerify]);

  // ── Turnstile ──────────────────────────────────────────
  useEffect(() => {
    if (PROVIDER !== "turnstile" || !containerRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY not set");
      return;
    }

    // Load script if not already loaded
    if (!document.getElementById("cf-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const waitForTurnstile = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).turnstile && containerRef.current) {
        clearInterval(waitForTurnstile);
        (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token: string) => {
            onVerify({ token });
          },
        });
      }
    }, 100);

    return () => clearInterval(waitForTurnstile);
  }, [onVerify]);

  // ── hCaptcha ───────────────────────────────────────────
  useEffect(() => {
    if (PROVIDER !== "hcaptcha" || !containerRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error("NEXT_PUBLIC_HCAPTCHA_SITE_KEY not set");
      return;
    }

    if (!document.getElementById("hcaptcha-script")) {
      const script = document.createElement("script");
      script.id = "hcaptcha-script";
      script.src = "https://js.hcaptcha.com/1/api.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const waitForHCaptcha = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).hcaptcha && containerRef.current) {
        clearInterval(waitForHCaptcha);
        (window as any).hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token: string) => {
            onVerify({ token });
          },
        });
      }
    }, 100);

    return () => clearInterval(waitForHCaptcha);
  }, [onVerify]);

  // ── Render ─────────────────────────────────────────────
  if (PROVIDER === "none") {
    return (
      <>
        {/* Honeypot field — hidden from users and screen readers */}
        <input
          type="text"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </>
    );
  }

  // Turnstile or hCaptcha container
  return (
    <div className="flex justify-center my-2">
      <div ref={containerRef} />
    </div>
  );
}

/**
 * Helper to build the final BotCheckData at submit time.
 * For the "none" provider, this re-captures the actual submit timestamp.
 */
export function buildBotCheckPayload(widgetData: BotCheckData): BotCheckData {
  if (PROVIDER === "none") {
    return {
      ...widgetData,
      formSubmittedAt: Date.now(),
    };
  }
  return widgetData;
}
