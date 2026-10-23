import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Site-wide gate. While SITE_PASSWORD is set, the whole deployment sits behind a
// single Basic Auth prompt, so the instance stays private no matter what. Unset
// SITE_PASSWORD to open the site to the public. There is no other auth: the app
// has no accounts, and progress lives in the browser's localStorage.
export default function middleware(_req: NextRequest, _event: NextFetchEvent) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const expected = `Basic ${btoa(`mob:${password}`)}`;
  if ((_req.headers.get("authorization") ?? "") === expected) return null;

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=Make or Break, charset=UTF-8" },
  });
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
