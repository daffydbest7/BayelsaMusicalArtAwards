"use client";

import { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdminPath } from "@/lib/admin-path";
import { AlertCircle, CheckCircle2, Lock, ArrowLeft, KeyRound, Loader2 } from "lucide-react";

export default function AdminResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuthSession() {
      try {
        // First check existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasValidSession(true);
          setCheckingSession(false);
          return;
        }

        // Listen for auth state changes (e.g. PASSWORD_RECOVERY event or session established via hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session) {
            setHasValidSession(true);
            setCheckingSession(false);
          }
        });

        // Timeout fallback to allow hash/token parsing to complete
        const timer = setTimeout(async () => {
          const { data: { session: recheck } } = await supabase.auth.getSession();
          if (recheck) {
            setHasValidSession(true);
          }
          setCheckingSession(false);
          subscription.unsubscribe();
        }, 1200);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Session check error:", err);
        setCheckingSession(false);
      }
    }

    checkAuthSession();
  }, []);

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg("Password reset successfully! You can now log in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please try requesting a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-white p-4">
      {/* Glossy Backdrop light */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-gold/5 blur-[100px] pointer-events-none" />

      <main className="w-full max-w-md flex flex-col gap-6 bg-brand-surface p-6 sm:p-8 rounded-md border border-brand-brown-deep shadow-black/40 z-10">
        <div className="text-center flex flex-col gap-1.5">
          <div className="w-12 h-12 bg-brand-gold/10 border border-brand-gold/30 rounded-full flex items-center justify-center mx-auto mb-1 text-brand-gold">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-wide text-brand-gold uppercase">
            Reset Password
          </h1>
          <p className="font-sans text-xs text-brand-white/50 font-medium">
            Enter a new password for your admin account
          </p>
        </div>

        {checkingSession ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
            <p className="text-xs text-brand-white/60 font-sans">Verifying security session...</p>
          </div>
        ) : successMsg ? (
          <div className="flex flex-col gap-5 text-center">
            <div className="p-4 rounded bg-brand-status-approved/15 border border-brand-status-approved/30 text-brand-status-approved text-xs font-sans">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
              <p className="font-bold text-sm">{successMsg}</p>
            </div>
            <a
              href={getAdminPath("login")}
              className="w-full py-2.5 bg-brand-gold text-brand-bg font-heading text-xs font-bold tracking-wider uppercase rounded hover:bg-brand-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              Go to Admin Login
            </a>
          </div>
        ) : !hasValidSession ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="p-4 rounded bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected text-xs font-sans">
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
              <p className="font-semibold">Invalid or Expired Reset Link</p>
              <p className="mt-1 text-brand-white/70">
                Your password reset link is invalid or has expired. Please request a new password reset link from the login page.
              </p>
            </div>
            <a
              href={getAdminPath("login")}
              className="w-full py-2.5 bg-brand-gold text-brand-bg font-heading text-xs font-bold tracking-wider uppercase rounded hover:bg-brand-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3 rounded bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected flex gap-2.5 items-center text-left text-xs font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1 text-left">
              <label className="font-sans text-xs font-semibold text-brand-white/80">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="font-sans text-xs font-semibold text-brand-white/80">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/20"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 bg-brand-gold text-brand-bg font-heading text-sm font-bold tracking-wider uppercase rounded-md hover:bg-brand-gold/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Update Password"
              )}
            </button>

            <div className="text-center mt-2">
              <a
                href={getAdminPath("login")}
                className="text-xs text-brand-white/40 hover:text-brand-gold transition-colors inline-flex items-center gap-1 font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </a>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
