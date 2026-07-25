import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const { auth } = NextAuth(authConfig);

// Site-wide gate. While SITE_PASSWORD is set, the whole deployment sits behind a
// single Basic Auth prompt, so the instance stays private no matter what the
// app's own auth allows. Unset SITE_PASSWORD to open the site to the public.
function locked(req: NextRequest): NextResponse | null {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const expected = `Basic ${btoa(`mob:${password}`)}`;
  if ((req.headers.get("authorization") ?? "") === expected) return null;

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Make or Break", charset="UTF-8"' },
  });
}

// Edge middleware: the private gate first, then Auth.js verifies the JWT session
// and enforces the `authorized` callback in auth.config.ts. No Prisma/bcrypt here.
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  return (
    locked(req) ??
    (auth as unknown as (r: NextRequest, e: NextFetchEvent) => Response)(req, event)
  );
}

export const config = {
  // Run on everything except Next internals, the auth API, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
