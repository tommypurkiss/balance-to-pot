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

  console.log("[Monzo callback] Received:", { hasCode: !!code, hasState: !!state, error });

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

  console.log("[Monzo callback] Cookies:", {
    hasStoredState: !!storedState,
    stateMatch: state === storedState,
    hasUserId: !!userId,
    userId: userId?.slice(0, 8) + "...",
  });

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
    console.log("[Monzo callback] Exchanging code for tokens...");
    const tokens = await exchangeMonzoCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token - ensure Monzo client is confidential");
    }
    console.log("[Monzo callback] Token exchange success");

    let accounts;
    try {
      const result = await fetchMonzoAccounts(accessToken);
      accounts = result.accounts;
    } catch (err) {
      if (err instanceof MonzoForbiddenError) {
        console.log("[Monzo callback] 403 - storing tokens for pending approval flow");
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

    console.log("[Monzo callback] Fetched accounts:", accounts?.length ?? 0);
    if (accounts?.length) {
      console.log("[Monzo callback] Raw Monzo API accounts (id, type, description):", accounts.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
      })));
    }

    await syncMonzoToDb(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: tokens.expires_in,
      },
      userId
    );

    console.log("[Monzo callback] Success, redirecting to dashboard");
    return NextResponse.redirect(
      new URL("/dashboard/accounts?monzo=connected", APP_URL)
    );
  } catch (err) {
    if (err instanceof MonzoForbiddenError) {
      console.warn("[Monzo callback] User must approve in Monzo app first");
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
