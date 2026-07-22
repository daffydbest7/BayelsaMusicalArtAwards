import { requireAdmin, isNetworkError } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { SystemSettingsClient, SettingsData } from "@/components/admin/SystemSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  // 1. Auth Gate (Server-side)
  await requireAdmin();

  let settings: any = {
    id: 1,
    submission_open_at: "2026-07-01T00:00:00Z",
    submission_close_at: "2026-09-30T23:59:59Z",
    voting_open_at: "2026-10-01T00:00:00Z",
    voting_close_at: "2026-11-30T23:59:59Z",
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();

    // 2. Fetch singleton system settings row directly on the server
    const { data: dbSettings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (dbSettings) {
      settings = dbSettings;
    }
  } catch (err) {
    if (!isNetworkError(err)) {
      console.error("Settings page DB fetch error:", err);
    }
  }

  return <SystemSettingsClient initialSettings={(settings as SettingsData) || null} />;
}
