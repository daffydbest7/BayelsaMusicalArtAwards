import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/roles";
import { getCategoryNameFromSlug } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auth Check
    await requireAdmin();

    const supabase = createAdminClient();

    // 1. Fetch total submissions and breakdown
    const { data: subData, error: subError } = await supabase
      .from("submissions")
      .select("id, status, category, submitted_at");

    if (subError) {
      console.error("Dashboard sub fetch error:", subError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch submission statistics." },
        { status: 500 }
      );
    }

    const totalSubmissions = subData.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    // Categories breakdown mapping
    const categoryCounts: Record<string, number> = {};

    // Submissions over time (grouped by date)
    const timeCounts: Record<string, number> = {};

    subData.forEach((sub) => {
      // Status breakdown
      if (sub.status === "pending") pendingCount++;
      else if (sub.status === "approved") approvedCount++;
      else if (sub.status === "rejected") rejectedCount++;

      // Category breakdown
      const categoryName = getCategoryNameFromSlug(sub.category) || sub.category;
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;

      // Group by date (YYYY-MM-DD)
      const dateStr = new Date(sub.submitted_at).toISOString().split("T")[0];
      timeCounts[dateStr] = (timeCounts[dateStr] || 0) + 1;
    });

    // 2. Fetch total votes count
    const { count: totalVotes, error: voteError } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true });

    if (voteError) {
      console.error("Dashboard vote fetch error:", voteError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch vote counts." },
        { status: 500 }
      );
    }

    // 3. Fetch Settings (auto-initialize row id=1 if missing)
    let { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!settings) {
      const { data: newSettings } = await supabase
        .from("settings")
        .upsert({ id: 1 })
        .select("*")
        .maybeSingle();

      settings = newSettings || {
        id: 1,
        submission_open_at: "2026-07-01T00:00:00Z",
        submission_close_at: "2026-09-30T23:59:59Z",
        voting_open_at: "2026-10-01T00:00:00Z",
        voting_close_at: "2026-11-30T23:59:59Z",
        updated_at: new Date().toISOString(),
      };
    }

    // Format chart data arrays
    const categoryChartData = Object.keys(categoryCounts).map((catName) => ({
      name: catName,
      submissions: categoryCounts[catName],
    })).sort((a, b) => b.submissions - a.submissions); // Sort by highest submissions first

    const timeChartData = Object.keys(timeCounts).map((date) => ({
      date,
      count: timeCounts[date],
    })).sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalVotes: totalVotes || 0,
      },
      categoryData: categoryChartData,
      timeData: timeChartData,
      settings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
