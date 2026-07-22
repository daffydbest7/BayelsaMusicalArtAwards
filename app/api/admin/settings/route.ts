import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/roles";
import { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings
 * Fetch the singleton settings row (id=1).
 * Both super_admin and site_manager can access.
 */
export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    let { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!data) {
      const { data: newSettings } = await supabase
        .from("settings")
        .upsert({ id: 1 })
        .select("*")
        .maybeSingle();

      data = newSettings || {
        id: 1,
        submission_open_at: "2026-07-01T00:00:00Z",
        submission_close_at: "2026-09-30T23:59:59Z",
        voting_open_at: "2026-10-01T00:00:00Z",
        voting_close_at: "2026-11-30T23:59:59Z",
        updated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * PATCH /api/admin/settings
 * Update submission/voting window dates.
 * Both super_admin and site_manager can access.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      submission_open_at,
      submission_close_at,
      voting_open_at,
      voting_close_at,
    } = body;

    // Validate that at least one field is provided
    if (!submission_open_at && !submission_close_at && !voting_open_at && !voting_close_at) {
      return NextResponse.json(
        { success: false, error: "At least one date field is required." },
        { status: 400 }
      );
    }

    // Build update payload with only the provided fields
    const updateData: Database["public"]["Tables"]["settings"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (submission_open_at !== undefined) updateData.submission_open_at = submission_open_at;
    if (submission_close_at !== undefined) updateData.submission_close_at = submission_close_at;
    if (voting_open_at !== undefined) updateData.voting_open_at = voting_open_at;
    if (voting_close_at !== undefined) updateData.voting_close_at = voting_close_at;

    // Cross-validate: open must be before close for each window
    const subOpen = submission_open_at ? new Date(submission_open_at) : null;
    const subClose = submission_close_at ? new Date(submission_close_at) : null;
    const voteOpen = voting_open_at ? new Date(voting_open_at) : null;
    const voteClose = voting_close_at ? new Date(voting_close_at) : null;

    if (subOpen && subClose && subOpen >= subClose) {
      return NextResponse.json(
        { success: false, error: "Submission open date must be before close date." },
        { status: 400 }
      );
    }

    if (voteOpen && voteClose && voteOpen >= voteClose) {
      return NextResponse.json(
        { success: false, error: "Voting open date must be before close date." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("settings")
      .update(updateData)
      .eq("id", 1);

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
