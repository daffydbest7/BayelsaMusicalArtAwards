import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/admin/reset-password";
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
  }

  const adminBasePath = process.env.ADMIN_BASE_PATH || "admin";
  let targetPath = next;

  // Resolve internal /admin paths to the secret ADMIN_BASE_PATH slug
  if (targetPath.startsWith("/admin")) {
    targetPath = targetPath.replace(/^\/admin/, `/${adminBasePath}`);
  } else if (!targetPath.startsWith(`/${adminBasePath}`)) {
    targetPath = `/${adminBasePath}/reset-password`;
  }

  return NextResponse.redirect(new URL(targetPath, requestUrl.origin));
}
