import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeMonzoCode,
  fetchMonzoAccounts,
  MonzoForbiddenError,
} from "@/lib/api/monzo";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMonzoToDb } from "@/lib/monzo/sync";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[Monzo callback] OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, APP_URL)
    );
  }

  if (!code || !state) {
    console.error("[Monzo callback] Missing code or state");
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=missing_params", APP_URL)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("monzo_oauth_state")?.value;
  const userId = cookieStore.get("monzo_oauth_user")?.value;

  if (!storedState || state !== storedState || !userId) {
    console.error("[Monzo callback] Invalid state or missing userId");
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=invalid_state", APP_URL)
    );
  }

  // Clear OAuth cookies
  cookieStore.delete("monzo_oauth_state");
  cookieStore.delete("monzo_oauth_user");

  // Must match exactly what was sent to Monzo in the auth request (MONZO_REDIRECT_URI)
  const redirectUri =
    process.env.MONZO_REDIRECT_URI ||
    `${APP_URL}/api/auth/monzo/callback`;

  try {
    const tokens = await exchangeMonzoCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token - ensure Monzo client is confidential");
    }
    let accounts;
    try {
      const result = await fetchMonzoAccounts(accessToken);
      accounts = result.accounts;
    } catch (err) {
      if (err instanceof MonzoForbiddenError) {
        const supabase = createAdminClient();
        const { data: pending, error: insertError } = await supabase
          .from("monzo_pending_approvals")
          .insert({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("[Monzo callback] Failed to store pending:", insertError);
          return NextResponse.redirect(
            new URL("/dashboard/accounts?error=monzo_pending_approval", APP_URL)
          );
        }

        return NextResponse.redirect(
          new URL(
            `/dashboard/accounts?monzo=pending_approval&pending_id=${pending.id}`,
            APP_URL
          )
        );
      }
      throw err;
    }

    await syncMonzoToDb(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: tokens.expires_in,
      },
      userId
    );

    return NextResponse.redirect(
      new URL("/dashboard/accounts?monzo=connected", APP_URL)
    );
  } catch (err) {
    if (err instanceof MonzoForbiddenError) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=monzo_pending_approval", APP_URL)
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Monzo callback] Error:", message, err);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(message)}`, APP_URL)
    );
  }
}
