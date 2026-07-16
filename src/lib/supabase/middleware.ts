import { createServerClient, CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

//(session refresh helper — required so getUser() doesn't randomly start failing mid-session)
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session if expired — required for Server Components to read it
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Coarse gate: not logged in and hitting a protected group → bounce to /login.
  // Fine-grained role checks happen in each group's layout.tsx.
  const protectedPaths = [
    "/dashboard",
    "/loans",
    "/contributions",
    "/statements",
    "/notifications",
    "/profile",
    "/admin",
  ];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
