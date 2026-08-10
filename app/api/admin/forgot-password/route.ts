import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyBotCheck } from "@/lib/bot-verify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, botCheck } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    // Verify bot check
    const botResult = await verifyBotCheck(botCheck);
    if (!botResult.success) {
      return NextResponse.json(
        { success: false, error: "Verification challenge failed. Please try again." },
        { status: 400 }
      );
    }

    const adminBasePath = process.env.ADMIN_BASE_PATH || "admin";
    const origin = request.nextUrl.origin;
    const redirectTo = `${origin}/auth/callback?next=/${adminBasePath}/reset-password`;

    const supabaseAdmin = createAdminClient();

    // Trigger Supabase Auth password reset email
    const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo,
      }
    );

    if (resetErr) {
      console.error("Password reset trigger error:", resetErr);
    }

    // Always return clean message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: "If an admin account exists for this email, a password reset link has been sent.",
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: true,
      message: "If an admin account exists for this email, a password reset link has been sent.",
    });
  }
}
