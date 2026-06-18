import { NextRequest, NextResponse } from "next/server";

const COOKIE = "cc-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login and auth API without a session
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!secret || !token || token !== secret) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};
