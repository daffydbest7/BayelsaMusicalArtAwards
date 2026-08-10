"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdminPath } from "@/lib/admin-path";

export function AuthRecoveryRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Check if the URL contains password recovery params (Implicit flow or direct redirect)
    const isRecoveryHash =
      hash.includes("type=recovery") ||
      (hash.includes("access_token=") && hash.includes("type=recovery"));
    const isRecoverySearch = search.includes("type=recovery");

    if (isRecoveryHash || isRecoverySearch) {
      const resetPath = getAdminPath("reset-password");
      // Prevent infinite loop if already on reset-password path
      if (!window.location.pathname.endsWith("/reset-password")) {
        window.location.href = `${resetPath}${hash}${search}`;
        return;
      }
    }

    // Also listen to Supabase auth state change events
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        const resetPath = getAdminPath("reset-password");
        if (!window.location.pathname.endsWith("/reset-password")) {
          window.location.href = resetPath;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
