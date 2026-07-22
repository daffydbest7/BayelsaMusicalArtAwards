import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/voting
 *
 * Returns live vote standings grouped by category, plus velocity flags.
 * Both super_admin and site_manager can access, but raw identifying data
 * (IP addresses, fingerprint hashes) is only included for super_admin (§6.1).
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    const isSuperAdmin = admin.role === "super_admin";

    const supabase = createAdminClient();

    // 1. Get all approved submissions with their details
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, stage_name, song_title, photo_url, category")
      .eq("status", "approved")
      .order("stage_name", { ascending: true });

    if (subError) {
      console.error("Voting standings - submissions error:", subError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch submissions." },
        { status: 500 }
      );
    }

    // 2. Get all votes with counts per submission
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("id, submission_id, category, voter_fingerprint_hash, ip_address, created_at");

    if (votesError) {
      console.error("Voting standings - votes error:", votesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch votes." },
        { status: 500 }
      );
    }

    // 3. Aggregate vote counts per submission
    const voteCounts: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    for (const vote of votes || []) {
      voteCounts[vote.submission_id] = (voteCounts[vote.submission_id] || 0) + 1;
      categoryTotals[vote.category] = (categoryTotals[vote.category] || 0) + 1;
    }

    // 4. Build standings per category
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

    // Sort each category's nominees by vote count descending
    const standings: Array<{
      category: string;
      totalVotes: number;
      nominees: Array<{
        id: string;
        stage_name: string;
        song_title: string;
        photo_url: string;
        votes: number;
      }>;
    }> = [];

    for (const [category, nominees] of categoryMap) {
      nominees.sort((a, b) => b.votes - a.votes);
      standings.push({
        category,
        totalVotes: categoryTotals[category] || 0,
        nominees,
      });
    }

    // Sort categories alphabetically
    standings.sort((a, b) => a.category.localeCompare(b.category));

    // 5. Build velocity flags — detect suspicious patterns
    const velocityFlags: Array<{
      type: string;
      category: string;
      pattern: string;
      count: number;
      // Raw data only for super_admin
      rawData?: Array<{ ip: string | null; fingerprint: string; timestamp: string }>;
    }> = [];

    // 5a. Check for fingerprints voting near the edge of their 24h reset window
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

    // Flag fingerprints with > 20 total votes (unusually active)
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

    // 5b. Check for IP-concentrated bursts (> 15 votes from same IP in 1 hour)
    const ipBuckets: Record<string, Array<{ fingerprint: string; category: string; created_at: string }>> = {};
    for (const vote of votes || []) {
      const ip = vote.ip_address || "unknown";
      if (!ipBuckets[ip]) ipBuckets[ip] = [];
      ipBuckets[ip].push({
        fingerprint: vote.voter_fingerprint_hash,
        category: vote.category,
        created_at: vote.created_at,
      });
    }

    for (const [ip, ipVotes] of Object.entries(ipBuckets)) {
      if (ip === "unknown" || ip === "0.0.0.0") continue;

      // Sort by time and check for bursts within 1 hour windows
      ipVotes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (let i = 0; i < ipVotes.length; i++) {
        const windowStart = new Date(ipVotes[i].created_at).getTime();
        const windowEnd = windowStart + 60 * 60 * 1000; // 1 hour
        const burst = ipVotes.filter(
          (v) => {
            const t = new Date(v.created_at).getTime();
            return t >= windowStart && t <= windowEnd;
          }
        );

        if (burst.length > 15) {
          const uniqueFingerprints = new Set(burst.map((v) => v.fingerprint));
          const categories = [...new Set(burst.map((v) => v.category))];

          velocityFlags.push({
            type: "ip_burst",
            category: categories.join(", "),
            pattern: `${burst.length} votes from 1 IP in 1 hour (${uniqueFingerprints.size} unique device${uniqueFingerprints.size !== 1 ? "s" : ""})`,
            count: burst.length,
            ...(isSuperAdmin
              ? {
                  rawData: burst.slice(0, 10).map((v) => ({
                    ip,
                    fingerprint: v.fingerprint,
                    timestamp: v.created_at,
                  })),
                }
              : {}),
          });
          break; // Only flag once per IP
        }
      }
    }

    // 6. Summary stats
    const totalVotes = votes?.length || 0;
    const uniqueVoters = new Set((votes || []).map((v) => v.voter_fingerprint_hash)).size;

    return NextResponse.json({
      success: true,
      data: {
        standings,
        totalVotes,
        uniqueVoters,
        velocityFlags,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
