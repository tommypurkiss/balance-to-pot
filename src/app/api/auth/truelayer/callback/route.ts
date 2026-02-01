import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeTrueLayerCode,
  fetchTrueLayerCards,
  fetchTrueLayerCardBalance,
} from "@/lib/api/truelayer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReconnectByDate } from "@/lib/utils/reconnection";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("[TrueLayer callback] Received:", {
    hasCode: !!code,
    hasState: !!state,
    error: error ?? null,
  });

  if (error) {
    console.log("[TrueLayer callback] OAuth error from TrueLayer:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/accounts?error=${encodeURIComponent(error)}`,
        APP_URL
      )
    );
  }

  if (!code || !state) {
    console.warn("[TrueLayer callback] Missing code or state");
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=missing_params", APP_URL)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("truelayer_oauth_state")?.value;
  const userId = cookieStore.get("truelayer_oauth_user")?.value;

  if (!storedState || state !== storedState || !userId) {
    console.warn("[TrueLayer callback] Invalid state or missing user:", {
      hasStoredState: !!storedState,
      stateMatch: state === storedState,
      hasUserId: !!userId,
    });
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=invalid_state", APP_URL)
    );
  }

  cookieStore.delete("truelayer_oauth_state");
  cookieStore.delete("truelayer_oauth_user");

  const redirectUri =
    process.env.TRUELAYER_REDIRECT_URI ||
    `${APP_URL}/api/auth/truelayer/callback`;

  try {
    console.log("[TrueLayer callback] Exchanging code for tokens...");
    const tokens = await exchangeTrueLayerCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token - ensure offline_access scope");
    }

    console.log("[TrueLayer callback] Fetching cards...");
    const { cards, rawResponse } = await fetchTrueLayerCards(accessToken);
    console.log("[TrueLayer callback] Storing", cards.length, "card(s)");
    const reconnectBy = getReconnectByDate();
    const supabase = createAdminClient();

    for (const card of cards) {
      let balanceData: { current?: number; available?: number; credit_limit?: number } = {};
      try {
        balanceData = await fetchTrueLayerCardBalance(
          accessToken,
          card.account_id
        );
      } catch {
        // Card might not support balance
      }

      // TrueLayer returns amounts in pounds; we store in pence (like Monzo) for formatCurrency
      const currentBalance = Math.round(Number(balanceData.current ?? 0) * 100);
      const availableCredit = Math.round(Number(balanceData.available ?? 0) * 100);
      const creditLimit = Math.round(Number(balanceData.credit_limit ?? 0) * 100);

      const cardName =
        card.display_name ||
        card.name_on_card ||
        `${card.card_network} •••• ${card.partial_card_number || "****"}`;
      const providerName = card.provider?.display_name ?? "TrueLayer";

      const { data: existing } = await supabase
        .from("credit_cards")
        .select("id")
        .eq("account_id", card.account_id)
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("credit_cards")
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: new Date(
              Date.now() + (tokens.expires_in ?? 3600) * 1000
            ).toISOString(),
            current_balance: currentBalance,
            available_credit: availableCredit,
            credit_limit: creditLimit,
            card_name: cardName,
            provider_name: providerName,
            last_four_digits: card.partial_card_number ?? null,
            last_synced: new Date().toISOString(),
            reconnect_by: reconnectBy.toISOString().split("T")[0],
            is_active: true,
          })
          .eq("id", existing.id);
        if (updateError) {
          console.error("[TrueLayer callback] Supabase update error:", updateError);
          throw new Error(`Failed to update card: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase.from("credit_cards").insert({
          user_id: userId,
          provider_id: card.provider?.provider_id ?? "truelayer",
          account_id: card.account_id,
          provider_name: providerName,
          card_name: cardName,
          last_four_digits: card.partial_card_number ?? null,
          current_balance: currentBalance,
          available_credit: availableCredit,
          credit_limit: creditLimit,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: new Date(
            Date.now() + (tokens.expires_in ?? 3600) * 1000
          ).toISOString(),
          reconnect_by: reconnectBy.toISOString().split("T")[0],
          last_synced: new Date().toISOString(),
        });
        if (insertError) {
          console.error("[TrueLayer callback] Supabase insert error:", insertError);
          throw new Error(`Failed to store card: ${insertError.message}`);
        }
      }
    }

    console.log("[TrueLayer callback] Success, redirecting to accounts");

    const isDev = process.env.NODE_ENV === "development";
    const rawObj =
      typeof rawResponse === "object" && rawResponse !== null
        ? (rawResponse as Record<string, unknown>)
        : null;
    const debugPayload: Record<string, unknown> = {
      tokenReceived: !!accessToken,
      cardsCount: cards.length,
      rawResponseKeys: rawObj ? Object.keys(rawObj) : ["(non-object)"],
      rawResponseSample: rawObj
        ? JSON.stringify(rawObj).slice(0, 1500)
        : String(rawResponse),
      firstCardKeys:
        cards[0] && typeof cards[0] === "object"
          ? Object.keys(cards[0] as object)
          : [],
      config: {
        redirectUri: redirectUri.replace(/\/[^/]+$/, "/***"),
        hasClientId: !!process.env.TRUELAYER_CLIENT_ID,
        hasClientSecret: !!process.env.TRUELAYER_CLIENT_SECRET,
      },
    };

    const redirectUrl = new URL("/dashboard/accounts", APP_URL);
    redirectUrl.searchParams.set("truelayer", "connected");
    if (isDev) {
      const encoded = Buffer.from(JSON.stringify(debugPayload)).toString(
        "base64url"
      );
      if (encoded.length < 1800) {
        redirectUrl.searchParams.set("truelayer_debug", encoded);
      }
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TrueLayer callback] Error:", err);
    const redirectUrl = new URL("/dashboard/accounts", APP_URL);
    redirectUrl.searchParams.set("error", message);
    if (process.env.NODE_ENV === "development") {
      redirectUrl.searchParams.set(
        "truelayer_debug",
        Buffer.from(
          JSON.stringify({
            error: message,
            tokenReceived: false,
            cardsCount: 0,
            config: {
              hasClientId: !!process.env.TRUELAYER_CLIENT_ID,
              hasClientSecret: !!process.env.TRUELAYER_CLIENT_SECRET,
            },
          })
        ).toString("base64url")
      );
    }
    return NextResponse.redirect(redirectUrl);
  }
}
