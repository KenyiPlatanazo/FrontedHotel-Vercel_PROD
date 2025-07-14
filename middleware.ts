// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicExact = [
  "/",
  "/auth/login",
  "/auth/register",
  "/signup",
  "/favicon.ico",
  "/rooms",
];

function getJwtPayload(token: string): { roles?: string[] } | null {
  try {
    const base64 = token.split(".")[1];
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicExact.includes(pathname)) {
    return NextResponse.next();
  }

  // 1) /rooms/** → requiere estar logueado
  if (pathname.startsWith("/rooms/")) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next();
  }

  // 2) /dashboard/** → solo ADMIN
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    const roles = getJwtPayload(token)?.roles || [];
    if (!roles.includes("ROLE_ADMIN")) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
    return NextResponse.next();
  }

  // 3) Resto de rutas privadas → al menos ROLE_USER
  {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    const roles = getJwtPayload(token)?.roles || [];
    if (!roles.includes("ROLE_USER") && !roles.includes("ROLE_ADMIN")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
