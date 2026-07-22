import { createAdminClient } from "@/lib/supabase/server";

export interface Settings {
  submission_open_at: string;
  submission_close_at: string;
  voting_open_at: string;
  voting_close_at: string;
}

/**
 * Fetches the singleton settings row from Supabase.
 * Falls back to sensible default dates if the database row or table doesn't exist.
 */
export async function getCachedSettings(): Promise<Settings> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("settings")
      .select("submission_open_at, submission_close_at, voting_open_at, voting_close_at")
      .eq("id", 1)
      .single();

    if (!error && data) {
      return {
        submission_open_at: data.submission_open_at || new Date("2026-07-01T00:00:00Z").toISOString(),
        submission_close_at: data.submission_close_at || new Date("2026-09-30T23:59:59Z").toISOString(),
        voting_open_at: data.voting_open_at || new Date("2026-10-01T00:00:00Z").toISOString(),
        voting_close_at: data.voting_close_at || new Date("2026-11-30T23:59:59Z").toISOString(),
      };
    }
  } catch (e) {
    console.error("Failed to load settings from Supabase:", e);
  }

  // Fallback defaults so the app remains functional during initial setup
  return {
    submission_open_at: new Date("2026-07-01T00:00:00Z").toISOString(),
    submission_close_at: new Date("2026-09-30T23:59:59Z").toISOString(),
    voting_open_at: new Date("2026-10-01T00:00:00Z").toISOString(),
    voting_close_at: new Date("2026-11-30T23:59:59Z").toISOString(),
  };
}
