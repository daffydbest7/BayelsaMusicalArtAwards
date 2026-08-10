import { requireAdmin, isNetworkError } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { getCategoryNameFromSlug } from "@/lib/constants/categories";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Auth Gate (Server-side)
  await requireAdmin();

  let totalSubmissions = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let totalVotes = 0;
  let categoryChartData: Array<{ name: string; submissions: number }> = [];
  let timeChartData: Array<{ date: string; count: number }> = [];
  let voteTimeChartData: Array<{ date: string; count: number }> = [];
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

    // 2. Fetch total submissions and breakdown
    const { data: subData } = await supabase
      .from("submissions")
      .select("id, status, category, submitted_at");

    if (subData) {
      totalSubmissions = subData.length;

      const categoryCounts: Record<string, number> = {};
      const timeCounts: Record<string, number> = {};

      subData.forEach((sub) => {
        if (sub.status === "pending") pendingCount++;
        else if (sub.status === "approved") approvedCount++;
        else if (sub.status === "rejected") rejectedCount++;

        const categoryName = getCategoryNameFromSlug(sub.category) || sub.category;
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;

        const dateStr = new Date(sub.submitted_at).toISOString().split("T")[0];
        timeCounts[dateStr] = (timeCounts[dateStr] || 0) + 1;
      });

      categoryChartData = Object.keys(categoryCounts)
        .map((catName) => ({
          name: catName,
          submissions: categoryCounts[catName],
        }))
        .sort((a, b) => b.submissions - a.submissions);

      timeChartData = Object.keys(timeCounts)
        .map((date) => ({
          date,
          count: timeCounts[date],
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // 3. Fetch votes data for total count and voting over time chart
    const { data: voteData, count: votesCount } = await supabase
      .from("votes")
      .select("created_at", { count: "exact" });

    if (voteData && voteData.length > 0) {
      totalVotes = votesCount || voteData.length;
      const voteTimeCounts: Record<string, number> = {};

      voteData.forEach((vote) => {
        const dateStr = new Date(vote.created_at).toISOString().split("T")[0];
        voteTimeCounts[dateStr] = (voteTimeCounts[dateStr] || 0) + 1;
      });

      voteTimeChartData = Object.keys(voteTimeCounts)
        .map((date) => ({
          date,
          count: voteTimeCounts[date],
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      totalVotes = votesCount || 0;
    }

    // 4. Fetch Settings
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
      console.error("Dashboard DB fetch error:", err);
    }
  }

  const stats = {
    totalSubmissions,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalVotes,
  };

  return (
    <DashboardClient
      initialStats={stats}
      initialCategoryData={categoryChartData}
      initialTimeData={timeChartData}
      initialVoteTimeData={voteTimeChartData}
      initialSettings={settings}
    />
  );
}
