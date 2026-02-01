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

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/accounts?error=${encodeURIComponent(error)}`,
        APP_URL
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=missing_params", APP_URL)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("truelayer_oauth_state")?.value;
  const userId = cookieStore.get("truelayer_oauth_user")?.value;

  if (!storedState || state !== storedState || !userId) {
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
    const tokens = await exchangeTrueLayerCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token - ensure offline_access scope");
    }

    const cards = await fetchTrueLayerCards(accessToken);
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

      const currentBalance = balanceData.current ?? 0;
      const availableCredit = balanceData.available ?? 0;
      const creditLimit = balanceData.credit_limit ?? 0;

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
        await supabase
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
      } else {
        await supabase.from("credit_cards").insert({
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
      }
    }

    return NextResponse.redirect(
      new URL("/dashboard/accounts?truelayer=connected", APP_URL)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/dashboard/accounts?error=${encodeURIComponent(message)}`,
        APP_URL
      )
    );
  }
}
