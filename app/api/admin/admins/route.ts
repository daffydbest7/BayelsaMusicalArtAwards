import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/admins
 * List all admin accounts with their emails from Supabase Auth.
 * super_admin only.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const supabase = createAdminClient();

    // Fetch admin_users rows
    const { data: admins, error } = await supabase
      .from("admin_users")
      .select("user_id, role, created_at, created_by")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Admins fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admin accounts." },
        { status: 500 }
      );
    }

    // Fetch email for each admin from Supabase Auth admin API
    const enrichedAdmins = await Promise.all(
      (admins || []).map(async (admin) => {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(admin.user_id);
          return {
            ...admin,
            email: authData?.user?.email || "Unknown",
          };
        } catch {
          return { ...admin, email: "Unknown" };
        }
      })
    );

    return NextResponse.json({ success: true, data: enrichedAdmins });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * POST /api/admin/admins
 * Invite a new admin user.
 * Creates a Supabase Auth user and inserts into admin_users.
 * super_admin only.
 */
export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await requireSuperAdmin();

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const validRole = role === "super_admin" ? "super_admin" : "site_manager";

    const supabase = createAdminClient();

    // 1. Create the auth user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since this is an admin-provisioned account
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      // Check for duplicate email
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: authError.message || "Failed to create auth user." },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "User creation returned no user." },
        { status: 500 }
      );
    }

    // 2. Insert into admin_users table
    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({
        user_id: authData.user.id,
        role: validRole as "super_admin" | "site_manager",
        created_by: currentAdmin.id,
      });

    if (insertError) {
      console.error("Admin insert error:", insertError);
      // Attempt to clean up the auth user if table insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Failed to provision admin role. Auth user rolled back." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: authData.user.id,
        email: authData.user.email,
        role: validRole,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * PATCH /api/admin/admins
 * Change an admin's role.
 * Cannot change own role.
 * super_admin only.
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentAdmin = await requireSuperAdmin();

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { success: false, error: "user_id and role are required." },
        { status: 400 }
      );
    }

    if (!["super_admin", "site_manager"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be 'super_admin' or 'site_manager'." },
        { status: 400 }
      );
    }

    // Prevent self role change
    if (user_id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("admin_users")
      .update({ role: role as "super_admin" | "site_manager" })
      .eq("user_id", user_id);

    if (error) {
      console.error("Admin role update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update admin role." },
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

/**
 * DELETE /api/admin/admins
 * Revoke an admin account (remove from admin_users).
 * Cannot revoke yourself.
 * super_admin only.
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentAdmin = await requireSuperAdmin();

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id query parameter is required." },
        { status: 400 }
      );
    }

    // Prevent self-revoke
    if (userId === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "You cannot revoke your own admin access." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Remove from admin_users table (auth user remains but loses admin privileges)
    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Admin revoke error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to revoke admin access." },
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
