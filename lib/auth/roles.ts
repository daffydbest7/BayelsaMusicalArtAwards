import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface AdminUser {
  id: string;
  email?: string;
  role: "super_admin" | "site_manager";
}

/** Helper to identify network connectivity / DNS errors */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const str = String(err);
  const cause = (err as any)?.cause ? String((err as any).cause) : "";
  const code = (err as any)?.code || (err as any)?.cause?.code;

  return (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    str.includes("ENOTFOUND") ||
    str.includes("fetch failed") ||
    str.includes("getaddrinfo") ||
    cause.includes("ENOTFOUND") ||
    cause.includes("fetch failed") ||
    cause.includes("getaddrinfo")
  );
}

/** Read session JWT claims locally from cookie when network is offline */
async function getOfflineSessionUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Find Supabase auth token cookie (named sb-<project>-auth-token or auth-token)
    const authCookie = allCookies.find((c) => c.name.includes("auth-token"));
    if (!authCookie || !authCookie.value) return null;

    let tokenStr = authCookie.value;
    if (tokenStr.startsWith("base64-")) {
      tokenStr = Buffer.from(tokenStr.replace("base64-", ""), "base64").toString("utf-8");
    }

    let accessToken = "";
    if (tokenStr.startsWith("[")) {
      const parsed = JSON.parse(tokenStr);
      accessToken = parsed[0];
    } else if (tokenStr.startsWith("{")) {
      const parsed = JSON.parse(tokenStr);
      accessToken = parsed.access_token || parsed.currentSession?.access_token || "";
    } else {
      accessToken = tokenStr;
    }

    if (!accessToken) return null;

    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);

    // Allow offline grace period if token expired recently (within 7 days)
    if (payload.exp && payload.exp < now - 7 * 86400) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      role: (payload.app_metadata?.role || "super_admin") as "super_admin" | "site_manager",
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the currently authenticated admin and their role.
 * Returns null ONLY if the user is truly unauthenticated.
 * Handles network outages gracefully without wiping logged-in sessions.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();

    // 1. Online verification via auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (isNetworkError(authError)) {
        // Supabase network unreachable — fall back to offline cookie session
        return await getOfflineSessionUser();
      }
      return null;
    }

    if (!user) {
      return null;
    }

    // 2. Query admin_users table for role
    try {
      const adminSupabase = createAdminClient();
      const { data: adminUser, error: dbError } = await adminSupabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminUser) {
        return {
          id: user.id,
          email: user.email,
          role: adminUser.role as "super_admin" | "site_manager",
        };
      }

      if (dbError) {
        if (isNetworkError(dbError)) {
          return {
            id: user.id,
            email: user.email,
            role: "super_admin",
          };
        }
        return null;
      }

      // If DB explicitly returned no record (not an offline error), user is not an admin
      return null;
    } catch (dbErr) {
      if (isNetworkError(dbErr)) {
        return {
          id: user.id,
          email: user.email,
          role: "super_admin",
        };
      }
      return null;
    }
  } catch (err) {
    if (isNetworkError(err)) {
      return await getOfflineSessionUser();
    }
    return null;
  }
}

/**
 * Verifies that the user is authenticated and is either role (super_admin or site_manager).
 * Throws an Error if unauthorized.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized: Admin credentials required.");
  }
  return admin;
}

/**
 * Verifies that the user is authenticated and is a super_admin.
 * Throws an Error if unauthorized.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Error("Forbidden: Super Admin privileges required.");
  }
  return admin;
}
