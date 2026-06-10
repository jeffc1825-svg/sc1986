import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * 只攔 /admin(Next.js 要求 matcher 為靜態字面值,無法 import routes.ts;
   * 修改 admin 路徑時必須同步修改 src/config/routes.ts)
   */
  matcher: ["/admin/:path*"],
};
