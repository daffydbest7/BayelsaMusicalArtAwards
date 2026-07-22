import { requireSuperAdmin, isNetworkError } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminManagementClient, AdminAccount } from "@/components/admin/AdminManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminsManagementPage() {
  // 1. Super Admin Auth Gate (Server-side enforcement)
  await requireSuperAdmin();

  let adminsList: AdminAccount[] = [];

  try {
    const supabase = createAdminClient();

    // 2. Fetch admin roles from DB
    const { data: adminUsers } = await supabase
      .from("admin_users")
      .select("user_id, role, created_at, created_by")
      .order("created_at", { ascending: true });

    // 3. Fetch user email addresses via Supabase Auth Admin API
    const { data: authUsersData } = await supabase.auth.admin.listUsers();
    const userEmailMap = new Map<string, string>();
    (authUsersData?.users || []).forEach((u) => {
      if (u.email) userEmailMap.set(u.id, u.email);
    });

    adminsList = (adminUsers || []).map((row) => ({
      user_id: row.user_id,
      email: userEmailMap.get(row.user_id) || "unknown@domain.com",
      role: row.role as "super_admin" | "site_manager",
      created_at: row.created_at,
      created_by: row.created_by,
    }));
  } catch (err) {
    if (!isNetworkError(err)) {
      console.error("Admins management DB fetch error:", err);
    }
  }

  return <AdminManagementClient initialAdmins={adminsList} />;
}
