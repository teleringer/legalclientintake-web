import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === "false";

  // Allow local development to bypass maintenance mode
  const isLocalhost =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";

  if (maintenance && !isLocalhost) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!maintenance|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)",
  ],
};