import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyBotCheck, BotCheckPayload } from "@/lib/bot-verify";
import { CATEGORIES, getCategorySlug } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

/**
 * POST /api/vote
 *
 * Verification & Execution:
 * 1. Bot-check token verified FIRST — reject before touching the database
 * 2. Validate submission_id, category format
 * 3. Atomic single-query cast_vote RPC call (verifies window, submission eligibility, rate limits & inserts vote in 1 DB roundtrip)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submission_id,
      category,
      voter_fingerprint_hash,
      // Bot check fields
      token,
      honeypot,
      formRenderedAt,
      formSubmittedAt,
    } = body;

    // ── Step 1: Bot verification (BEFORE any database access) ──
    const botPayload: BotCheckPayload = {
      token,
      honeypot,
      formRenderedAt,
      formSubmittedAt,
    };
    const botResult = await verifyBotCheck(botPayload);
    if (!botResult.success) {
      // Generic message — never reveal which check failed
      return NextResponse.json(
        { success: false, reason: "verification_failed" },
        { status: 400 }
      );
    }

    // ── Step 2: Input validation ──
    if (!submission_id || !category || !voter_fingerprint_hash) {
      return NextResponse.json(
        { success: false, reason: "invalid_request", message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Validate category is a known slug
    const validSlugs = CATEGORIES.map((c) => getCategorySlug(c));
    if (!validSlugs.includes(category)) {
      return NextResponse.json(
        { success: false, reason: "invalid_request", message: "Invalid category." },
        { status: 400 }
      );
    }

    // ── Step 3: Atomic cast_vote RPC execution (Single DB Roundtrip) ──
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "0.0.0.0";

    const supabase = createAdminClient();
    const { data: voteResult, error: voteError } = await supabase.rpc("cast_vote", {
      p_submission_id: submission_id,
      p_category: category,
      p_voter_fingerprint_hash: voter_fingerprint_hash,
      p_ip_address: ip,
    });

    if (voteError) {
      console.error("cast_vote RPC error:", voteError);
      return NextResponse.json(
        { success: false, reason: "server_error", message: "Failed to record vote." },
        { status: 500 }
      );
    }

    const result = voteResult as {
      success: boolean;
      reason?: string;
      votes_used?: number;
      votes_remaining?: number;
      voting_open_at?: string;
    };

    if (!result.success) {
      switch (result.reason) {
        case "voting_not_open":
          return NextResponse.json(
            {
              success: false,
              reason: "voting_not_open",
              message: "Voting hasn't started yet.",
              voting_open_at: result.voting_open_at,
            },
            { status: 403 }
          );
        case "voting_closed":
          return NextResponse.json(
            {
              success: false,
              reason: "voting_closed",
              message: "Voting has closed for BMAA 2026. Thank you for participating.",
            },
            { status: 403 }
          );
        case "submission_not_found":
          return NextResponse.json(
            { success: false, reason: "invalid_request", message: "Submission not found." },
            { status: 404 }
          );
        case "not_approved":
          return NextResponse.json(
            { success: false, reason: "invalid_request", message: "This nominee is not eligible for votes." },
            { status: 400 }
          );
        case "limit_reached":
          return NextResponse.json(
            {
              success: false,
              reason: "limit_reached",
              message: `You've used all your votes for this category today. Come back in 24 hours for more.`,
              votes_used: result.votes_used,
            },
            { status: 429 }
          );
        default:
          return NextResponse.json(
            { success: false, reason: "vote_failed", message: "Vote could not be recorded." },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({
      success: true,
      votes_remaining: result.votes_remaining,
    });
  } catch (err: unknown) {
    console.error("Vote endpoint error:", err);
    return NextResponse.json(
      { success: false, reason: "server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
