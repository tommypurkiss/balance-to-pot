import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeMonzoCode,
  fetchMonzoAccounts,
  fetchMonzoBalance,
  fetchMonzoPots,
} from "@/lib/api/monzo";
import { createClient } from "@/lib/supabase/server";
import { getReconnectByDate } from "@/lib/utils/reconnection";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Monzo OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, APP_URL)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=missing_params", APP_URL)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("monzo_oauth_state")?.value;
  const userId = cookieStore.get("monzo_oauth_user")?.value;

  if (!storedState || state !== storedState || !userId) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=invalid_state", APP_URL)
    );
  }

  // Clear OAuth cookies
  cookieStore.delete("monzo_oauth_state");
  cookieStore.delete("monzo_oauth_user");

  const redirectUri = `${APP_URL}/api/auth/monzo/callback`;

  try {
    const tokens = await exchangeMonzoCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token - ensure Monzo client is confidential");
    }

    const { accounts } = await fetchMonzoAccounts(accessToken);
    const reconnectBy = getReconnectByDate();

    const supabase = await createClient();

    for (const account of accounts) {

      const balanceData = await fetchMonzoBalance(
        accessToken,
        account.id
      ).catch(() => null);

      const balance = balanceData?.balance ?? 0;

      const { data: existingAccount } = await supabase
        .from("monzo_accounts")
        .select("id")
        .eq("account_id", account.id)
        .eq("user_id", userId)
        .single();

      const accountType = account.type === "uk_retail" ? "current" : account.type === "uk_retail_joint" ? "current" : "other";
      const accountName = account.description || `${accountType} Account`;

      if (existingAccount) {
        await supabase
          .from("monzo_accounts")
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            balance,
            account_name: accountName,
            account_type: accountType,
            reconnect_by: reconnectBy.toISOString().split("T")[0],
            last_synced: new Date().toISOString(),
            is_active: true,
          })
          .eq("id", existingAccount.id);

        const { pots } = await fetchMonzoPots(accessToken, account.id).catch(
          () => ({ pots: [] })
        );

        for (const pot of pots) {
          if (pot.deleted) continue;

          await supabase.from("monzo_pots").upsert(
            {
              monzo_account_id: existingAccount.id,
              pot_id: pot.id,
              pot_name: pot.name,
              balance: pot.balance,
              last_synced: new Date().toISOString(),
            },
            { onConflict: "pot_id" }
          );
        }
      } else {
        const { data: newAccount, error: insertError } = await supabase
          .from("monzo_accounts")
          .insert({
            user_id: userId,
            account_id: account.id,
            account_name: accountName,
            account_type: accountType,
            balance,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            reconnect_by: reconnectBy.toISOString().split("T")[0],
            last_synced: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to insert Monzo account:", insertError);
          continue;
        }

        const { pots } = await fetchMonzoPots(accessToken, account.id).catch(
          () => ({ pots: [] })
        );

        for (const pot of pots) {
          if (pot.deleted) continue;

          await supabase.from("monzo_pots").upsert(
            {
              monzo_account_id: newAccount.id,
              pot_id: pot.id,
              pot_name: pot.name,
              balance: pot.balance,
              last_synced: new Date().toISOString(),
            },
            { onConflict: "pot_id" }
          );
        }
      }
    }

    const { data: profile } = await supabase
      .from("users_profile")
      .select("onboarding_step")
      .eq("id", userId)
      .single();

    if (profile && profile.onboarding_step === 1) {
      await supabase
        .from("users_profile")
        .update({ onboarding_step: 2, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return NextResponse.redirect(
      new URL("/dashboard/accounts?monzo=connected", APP_URL)
    );
  } catch (err) {
    console.error("Monzo OAuth callback error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(message)}`, APP_URL)
    );
  }
}
