import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

// Regex pattern for BMAA-2026 reference IDs (e.g. BMAA-2026-F982DA)
const REF_ID_REGEX = /^BMAA-2026-[A-Z0-9]{6}$/i;

export async function POST(request: Request) {
  try {
    // 1. IP Rate Limiting Guard
    const clientIp = 
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Limit to 5 submission tracking checks per 1 minute per IP address
    if (isRateLimited(clientIp, 5, 60 * 1000)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Too many tracking requests. Please wait 1 minute before trying again." 
        },
        { status: 429 }
      );
    }

    const { referenceId } = await request.json();

    if (!referenceId || typeof referenceId !== "string") {
      return NextResponse.json(
        { success: false, error: "Reference ID is required." },
        { status: 400 }
      );
    }

    const trimmedId = referenceId.trim().toUpperCase();

    // 2. Strict Format/Regex Validation
    // Exclude invalid formats immediately to prevent useless database lookups
    if (!REF_ID_REGEX.test(trimmedId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Reference ID format. (e.g. BMAA-2026-F982DA)" },
        { status: 400 }
      );
    }

    // 3. Query submission status from Supabase
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("stage_name, category, song_title, status, rejection_reason")
      .eq("reference_id", trimmedId)
      .maybeSingle();

    if (error) {
      console.error("Lookup error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to complete lookup at this time. Please try again." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "No entry found matching this Reference ID." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        stageName: data.stage_name,
        category: data.category,
        songTitle: data.song_title,
        status: data.status,
        rejectionReason: data.status === "rejected" ? data.rejection_reason : null,
      },
    });
  } catch (err) {
    console.error("Unexpected lookup handler error:", err);
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
