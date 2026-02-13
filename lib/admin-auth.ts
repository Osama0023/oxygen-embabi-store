import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { verifyMobileToken } from "@/lib/jwt";
async function hasRole(
  request: Request,
  allowedRoles: ("ADMIN" | "MEDIA_BUYER")[]
): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role && allowedRoles.includes(session.user.role as "ADMIN" | "MEDIA_BUYER")) {
    return true;
  }

  const authHeader = request.headers.get("Authorization");
  console.log(
    "[isAdminRequest] url",
    request.url,
    "authHeader",
    authHeader,
    "ua",
    request.headers.get("user-agent")
  );

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    console.log("[isAdminRequest] mobile payload", payload);
    if (payload?.role && allowedRoles.includes(payload.role as "ADMIN" | "MEDIA_BUYER")) {
      return true;
    }
  }

  const apiKey = request.headers.get("X-Admin-API-Key");
  const expectedKey = process.env.ADMIN_MOBILE_API_KEY;
  if (expectedKey && apiKey === expectedKey) return true;

  return false;
}

/**
 * Check if the request is authorized as admin.
 * Allows:
 * - NextAuth / JWT / API key, but only with role ADMIN
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  return hasRole(request, ["ADMIN"]);
}

/**
 * Check if the request is authorized to access analytics.
 * Allows:
 * - ADMIN
 * - MEDIA_BUYER
 */
export async function isAnalyticsUserRequest(
  request: Request
): Promise<boolean> {
  return hasRole(request, ["ADMIN", "MEDIA_BUYER"]);
}
