import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const adminBasePath = process.env.ADMIN_BASE_PATH; // e.g. "ops-2c874a318808"

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-pathname", pathname);

  // 1. Direct hit to /admin or /admin/* must return a plain 404
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Request matching /${ADMIN_BASE_PATH}/* gets rewritten to internal /admin/*
  if (adminBasePath) {
    const isExactMatch = pathname === `/${adminBasePath}`;
    const isSubPathMatch = pathname.startsWith(`/${adminBasePath}/`);

    if (isExactMatch || isSubPathMatch) {
      const subPath = pathname.substring(adminBasePath.length + 1); // everything after /${ADMIN_BASE_PATH}
      const internalPath = `/admin${subPath || ""}`;
      
      url.pathname = internalPath;
      
      // Pass x-admin-pathname to Server Components
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Image formats like png, jpg, jpeg, svg, gif (public static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|.*\\.(?:png|jpg|jpeg|svg|gif|js)$).*)",
  ],
};
