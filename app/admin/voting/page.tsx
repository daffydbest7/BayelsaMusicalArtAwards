import { requireAdmin, isNetworkError } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { VotingStandingsClient, VotingData } from "@/components/admin/VotingStandingsClient";

export const dynamic = "force-dynamic";

export default async function AdminVotingPage() {
  // 1. Auth Gate (Server-side)
  const admin = await requireAdmin();
  const isSuperAdmin = admin.role === "super_admin";

  let standings: VotingData["standings"] = [];
  let totalVotesCount = 0;
  let uniqueVotersCount = 0;
  let velocityFlags: VotingData["velocityFlags"] = [];

  try {
    const supabase = createAdminClient();

    // 2. Fetch approved submissions
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, stage_name, song_title, photo_url, category")
      .eq("status", "approved")
      .order("stage_name", { ascending: true });

    // 3. Fetch votes
    const { data: votes } = await supabase
      .from("votes")
      .select("id, submission_id, category, voter_fingerprint_hash, ip_address, created_at");

    // 4. Aggregate vote counts
    const voteCounts: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    const uniqueFingerprints = new Set<string>();

    for (const vote of votes || []) {
      voteCounts[vote.submission_id] = (voteCounts[vote.submission_id] || 0) + 1;
      categoryTotals[vote.category] = (categoryTotals[vote.category] || 0) + 1;
      uniqueFingerprints.add(vote.voter_fingerprint_hash);
    }

    // 5. Build standings per category
    const categoryMap = new Map<string, Array<{
      id: string;
      stage_name: string;
      song_title: string;
      photo_url: string;
      votes: number;
    }>>();

    for (const sub of submissions || []) {
      const categoryName = sub.category;
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push({
        id: sub.id,
        stage_name: sub.stage_name,
        song_title: sub.song_title,
        photo_url: sub.photo_url,
        votes: voteCounts[sub.id] || 0,
      });
    }

    for (const [category, nominees] of categoryMap) {
      nominees.sort((a, b) => b.votes - a.votes);
      standings.push({
        category,
        totalVotes: categoryTotals[category] || 0,
        nominees,
      });
    }

    standings.sort((a, b) => a.category.localeCompare(b.category));

    // 6. Build velocity flags
    const fingerprintVotes: Record<string, Array<{ category: string; ip: string | null; created_at: string }>> = {};
    for (const vote of votes || []) {
      if (!fingerprintVotes[vote.voter_fingerprint_hash]) {
        fingerprintVotes[vote.voter_fingerprint_hash] = [];
      }
      fingerprintVotes[vote.voter_fingerprint_hash].push({
        category: vote.category,
        ip: vote.ip_address,
        created_at: vote.created_at,
      });
    }

    for (const [fp, fpVotes] of Object.entries(fingerprintVotes)) {
      if (fpVotes.length > 20) {
        const categories = [...new Set(fpVotes.map((v) => v.category))];
        velocityFlags.push({
          type: "high_volume_voter",
          category: categories.join(", "),
          pattern: `Single voter with ${fpVotes.length} total votes across ${categories.length} categories`,
          count: fpVotes.length,
          ...(isSuperAdmin
            ? {
                rawData: fpVotes.slice(0, 10).map((v) => ({
                  ip: v.ip,
                  fingerprint: fp,
                  timestamp: v.created_at,
                })),
              }
            : {}),
        });
      }
    }

    totalVotesCount = votes?.length || 0;
    uniqueVotersCount = uniqueFingerprints.size;
  } catch (err) {
    if (!isNetworkError(err)) {
      console.error("Voting page DB fetch error:", err);
    }
  }

  const votingData: VotingData = {
    standings,
    totalVotes: totalVotesCount,
    uniqueVoters: uniqueVotersCount,
    velocityFlags,
  };

  return <VotingStandingsClient initialData={votingData} />;
}
