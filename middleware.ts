import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GUEST_ROUTES = ["/login"];
const PRIVATE_ROUTES = [
  "/dashboard",
  "/clients",
  "/products",
  "/invoices",
  "/company",
  "/api",
];

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isGuestRoute(pathname: string) {
  return GUEST_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const secureCookie = Boolean(
    req.cookies.get("__Secure-authjs.session-token"),
  );
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });

  const isLoggedIn = !!token;

  if (isGuestRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isPrivateRoute(pathname) && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/clients/:path*",
    "/products/:path*",
    "/invoices/:path*",
    "/company/:path*",
    "/api/:path*",
  ],
};
