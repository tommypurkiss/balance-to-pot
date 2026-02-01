import { NextResponse } from "next/server";
import { getMonzoAuthUrl } from "@/lib/api/monzo";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?redirect=/dashboard/accounts", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("monzo_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });
  cookieStore.set("monzo_oauth_user", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  const authUrl = getMonzoAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
