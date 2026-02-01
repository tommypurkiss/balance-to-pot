import { NextResponse } from "next/server";
import { getTrueLayerAuthUrl } from "@/lib/api/truelayer";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login?redirect=/dashboard/accounts", APP_URL)
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("truelayer_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });
  cookieStore.set("truelayer_oauth_user", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  const authUrl = getTrueLayerAuthUrl(state);
  console.log("[TrueLayer connect] Redirecting to TrueLayer OAuth");
  return NextResponse.redirect(authUrl);
}
