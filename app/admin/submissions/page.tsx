import { requireAdmin, isNetworkError } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { SubmissionsClient, Submission } from "@/components/admin/SubmissionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  // 1. Auth Gate (Server-side)
  const admin = await requireAdmin();

  let initialSubmissions: Submission[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const supabase = createAdminClient();

    // 2. Fetch initial pending submissions queue directly on the server
    const { data: initialData, count, error } = await supabase
      .from("submissions")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })
      .range(0, 14);

    if (!error && initialData) {
      initialSubmissions = initialData as Submission[];
      total = count || 0;
      totalPages = Math.max(1, Math.ceil(total / 15));
    }
  } catch (err) {
    if (!isNetworkError(err)) {
      console.error("Submissions page fetch error:", err);
    }
  }

  return (
    <SubmissionsClient
      initialSubmissions={initialSubmissions}
      initialTotal={total}
      initialTotalPages={totalPages}
      adminRole={admin.role}
    />
  );
}
