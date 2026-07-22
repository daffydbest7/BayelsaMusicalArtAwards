import { NextResponse, NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyBotCheck } from "@/lib/bot-verify";

/**
 * POST /api/admin/login
 * Handles admin login verification, bot check, and role mapping.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, botCheck } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Verify bot check (honeypot/timing or Turnstile/hCaptcha)
    const botResult = await verifyBotCheck(botCheck);
    if (!botResult.success) {
      return NextResponse.json(
        { success: false, error: "Verification challenge failed. Please try again." },
        { status: 400 }
      );
    }

    // 2. Sign in via Supabase Auth
    const supabaseServer = await createClient();
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    // 3. Check role mapping in admin_users table (using admin client to bypass client RLS quirks)
    const adminSupabase = createAdminClient();
    const { data: adminUser, error: roleError } = await adminSupabase
      .from("admin_users")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (roleError || !adminUser) {
      // Sign out auth session immediately if not registered as an admin
      await supabaseServer.auth.signOut();
      return NextResponse.json(
        { 
          success: false, 
          error: "Account authenticated, but not registered in admin_users. Please run: INSERT INTO admin_users (user_id, role) VALUES ('" + authData.user.id + "', 'super_admin'); in Supabase SQL Editor." 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      role: adminUser.role,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Invalid login credentials." },
      { status: 500 }
    );
  }
}
