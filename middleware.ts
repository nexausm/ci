import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const secureCookie = Boolean(
    req.cookies.get("__Secure-authjs.session-token"),
  );
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/clients/:path*",
    "/products/:path*",
    "/invoices/:path*",
    "/company/:path*",
    "/api/:path*",
  ],
};
