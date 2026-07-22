"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAdminPath } from "@/lib/admin-path";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { BotCheckWidget, BotCheckData, buildBotCheckPayload } from "@/components/BotCheckWidget";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [botData, setBotData] = useState<BotCheckData>({});

  const router = useRouter();

  const handleBotVerify = useCallback((data: BotCheckData) => {
    setBotData(data);
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // Build the final bot check payload (stamps submit time for "none" provider)
    const payload = buildBotCheckPayload(botData);

    // Client-side quick checks for the "none" fallback
    const provider = process.env.NEXT_PUBLIC_BOT_VERIFY_PROVIDER || "none";
    if (provider === "none") {
      if (payload.honeypot && payload.honeypot.length > 0) {
        setErrorMsg("Invalid credentials");
        setLoading(false);
        return;
      }
      if (
        payload.formRenderedAt &&
        payload.formSubmittedAt &&
        payload.formSubmittedAt - payload.formRenderedAt < 800
      ) {
        setErrorMsg("Invalid credentials");
        setLoading(false);
        return;
      }
    } else {
      // For turnstile/hcaptcha, require a token
      if (!payload.token) {
        setErrorMsg("Please complete the verification challenge.");
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          botCheck: payload,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Sync client auth state and redirect directly to admin dashboard
      await supabase.auth.signInWithPassword({ email, password });
      window.location.href = getAdminPath("");
    } catch (err) {
      setErrorMsg("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-white p-4">
      {/* Glossy Backdrop light */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-gold/5 blur-[100px] pointer-events-none" />

      <main className="w-full max-w-sm flex flex-col gap-6 bg-brand-surface p-6 sm:p-8 rounded-md border border-brand-brown-deep shadow-black/40 z-10">
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-wide text-brand-gold uppercase">System Access</h1>
          <p className="font-sans text-xs text-brand-white/40 font-semibold tracking-wider">Authorized Personnel Only</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected flex gap-2.5 items-center text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-sans text-xs font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                placeholder="name@domain.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Bot Check Widget — renders Turnstile/hCaptcha or hidden honeypot */}
          <BotCheckWidget onVerify={handleBotVerify} />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 bg-brand-gold disabled:bg-brand-surface disabled:text-brand-white/40 disabled:border-brand-brown-deep disabled:border text-brand-bg font-heading text-sm font-bold tracking-wider uppercase rounded-md glow-gold-hover hover:glow-gold transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Authenticate"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
