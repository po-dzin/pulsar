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
  const origin = `${url.protocol}//${url.host}`;
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
