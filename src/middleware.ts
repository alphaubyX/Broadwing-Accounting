import { NextResponse, type NextRequest } from "next/server";

// Temporary site-wide password until Broadwing's central sign-in exists.
// Enabled only when APP_PASSWORD is set (e.g. in cPanel → Setup Node.js App).

function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const username = process.env.APP_USERNAME || "admin";
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (i >= 0 && safeEqual(decoded.slice(0, i), username) && safeEqual(decoded.slice(i + 1), password)) {
        return NextResponse.next();
      }
    } catch {
      // fall through to the challenge
    }
  }
  return new NextResponse("Sign in to Broadwing Accounting.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Broadwing Accounting", charset="UTF-8"' },
  });
}

export const config = {
  // Everything except the health check and Next's static assets.
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
