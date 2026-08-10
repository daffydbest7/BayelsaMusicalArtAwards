import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/roles";
import { getAdminPath } from "@/lib/admin-path";
import { NavShell } from "@/components/admin/NavShell";

// Neutral title — must NOT reveal "BMAA" or "Admin" per REQUIREMENTS.md §6.1
export const metadata: Metadata = {
  title: "System Access",
  robots: { index: false, follow: false },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headerList = await headers();
  const originalPath = headerList.get("x-admin-pathname") || "";

  // Check if this is the login or reset-password route
  const isLoginRoute = originalPath.endsWith("/login");
  const isResetPasswordRoute = originalPath.endsWith("/reset-password");

  if (isLoginRoute || isResetPasswordRoute) {
    return <>{children}</>;
  }

  // Auth gate for all other admin routes
  const admin = await getCurrentAdmin();

  if (!admin) {
    // Redirect to the relative secret login path
    redirect(getAdminPath("login"));
  }

  return (
    <NavShell adminRole={admin.role} adminEmail={admin.email}>
      {children}
    </NavShell>
  );
}
