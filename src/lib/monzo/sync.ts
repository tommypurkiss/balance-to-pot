import {
  fetchMonzoAccounts,
  fetchMonzoBalance,
  fetchMonzoPots,
} from "@/lib/api/monzo";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReconnectByDate } from "@/lib/utils/reconnection";

export interface MonzoTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function syncMonzoToDb(
  tokens: MonzoTokenData,
  userId: string
): Promise<void> {
  const { access_token, refresh_token, expires_in } = tokens;
  const { accounts } = await fetchMonzoAccounts(access_token);
  const reconnectBy = getReconnectByDate();
  const supabase = createAdminClient();

  for (const account of accounts) {
    const balanceData = await fetchMonzoBalance(access_token, account.id).catch(
      () => null
    );
    const balance = balanceData?.balance ?? 0;

    const monzoType = (account as { type?: string }).type ?? "";
    const desc = (account.description ?? "").toLowerCase();
    const accountType =
      monzoType === "uk_retail" || monzoType === "uk_retail_joint"
        ? "current"
        : monzoType === "uk_rewards"
          ? "rewards"
          : monzoType === "uk_monzo_flex"
            ? "flex"
            : desc.includes("monzoflex")
              ? "flex"
              : desc.includes("rewardsoptin")
                ? "rewards"
                : "other";
    const { data: existingAccount } = await supabase
      .from("monzo_accounts")
      .select("id")
      .eq("account_id", account.id)
      .eq("user_id", userId)
      .single();

    const accountName = account.description || `${accountType} Account`;

    if (existingAccount) {
      await supabase
        .from("monzo_accounts")
        .update({
          access_token,
          refresh_token,
          token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
          balance,
          account_name: accountName,
          account_type: accountType,
          reconnect_by: reconnectBy.toISOString().split("T")[0],
          last_synced: new Date().toISOString(),
          is_active: true,
        })
        .eq("id", existingAccount.id);

      const { pots } = await fetchMonzoPots(access_token, account.id).catch(
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
          access_token,
          refresh_token,
          token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
          reconnect_by: reconnectBy.toISOString().split("T")[0],
          last_synced: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[Monzo sync] Failed to insert account:", insertError);
        continue;
      }

      const { pots } = await fetchMonzoPots(access_token, account.id).catch(
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
}
