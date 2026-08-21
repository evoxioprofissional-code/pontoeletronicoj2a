import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Tudo, exceto assets estáticos, PWA e modelos faciais.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|models/|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|bin)$).*)",
  ],
};
