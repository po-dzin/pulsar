import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

const safeNextPath = (value: string | null): string => {
  if (!value || !value.startsWith("/")) {
    return "/";
  }
  return value;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  // Use headers to get the actual host the user visited,
  // falling back to url.host if headers aren't available.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const actualHost = forwardedHost || host || url.host;

  // Determine protocol based on localhost vs prod
  const protocol = actualHost.includes("localhost") ? "http:" : "https:";
  const origin = `${protocol}//${actualHost}`;

  const fallbackRedirect = `${origin}${next}`;

  if (!code) {
    return NextResponse.redirect(fallbackRedirect);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/?auth=error`);
    }
    return NextResponse.redirect(fallbackRedirect);
  } catch {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
}
