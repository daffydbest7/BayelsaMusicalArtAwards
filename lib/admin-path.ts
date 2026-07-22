/**
 * Resolves a subpath relative to the active admin base path.
 * - On the client, it extracts the first path segment from window.location.pathname.
 * - On the server, it uses the ADMIN_BASE_PATH environment variable.
 *
 * This ensures that links and redirects do not expose the internal "/admin" path in the URL bar.
 */
export function getAdminPath(subpath: string = ""): string {
  const cleanSubpath = subpath.startsWith("/") ? subpath.substring(1) : subpath;

  if (typeof window !== "undefined") {
    // Client-side: extract base path from location
    const segments = window.location.pathname.split("/").filter(Boolean);
    const baseSlug = segments[0] || "admin"; // Fallback to "admin"
    return `/${baseSlug}${cleanSubpath ? `/${cleanSubpath}` : ""}`;
  } else {
    // Server-side: read from env
    const baseSlug = process.env.ADMIN_BASE_PATH || "admin";
    return `/${baseSlug}${cleanSubpath ? `/${cleanSubpath}` : ""}`;
  }
}
