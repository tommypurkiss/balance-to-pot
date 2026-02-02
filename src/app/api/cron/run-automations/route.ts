import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  depositIntoMonzoPot,
  fetchMonzoBalance,
  refreshMonzoToken,
} from "@/lib/api/monzo";
import { computeNextRunAt } from "@/lib/utils/nextRunAt";

/**
 * Runs due automations: deposits money from Monzo current account into pots.
 * Trigger via Vercel Cron (vercel.json) or external cron hitting this endpoint.
 * Auth: Authorization: Bearer <CRON_SECRET> OR ?secret=<CRON_SECRET> (for Vercel cron).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = request.nextUrl.searchParams.get("secret");
    const isValid =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: dueNow, error: fetchError } = await supabase
    .from("automations")
    .select("id, name, amount, frequency, day_of_week, day_of_month, next_run_at, destination_monzo_pot_id")
    .eq("is_active", true)
    .lte("next_run_at", now);

  const { data: needsBackfill } = await supabase
    .from("automations")
    .select("id, name, amount, frequency, day_of_week, day_of_month, next_run_at, destination_monzo_pot_id")
    .eq("is_active", true)
    .is("next_run_at", null);

  const automations = [
    ...(dueNow ?? []),
    ...(needsBackfill ?? []),
  ].filter((a) => !a.next_run_at || a.next_run_at <= now);

  if (fetchError) {
    console.error("[run-automations] Fetch error:", fetchError);
    return NextResponse.json(
      { error: fetchError.message, ran: 0 },
      { status: 500 }
    );
  }

  if (!automations?.length) {
    return NextResponse.json({ ran: 0, message: "No automations due" });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const automation of automations) {
    const { data: pot, error: potError } = await supabase
      .from("monzo_pots")
      .select("pot_id, monzo_account_id")
      .eq("id", automation.destination_monzo_pot_id)
      .single();

    if (potError || !pot) {
      results.push({ id: automation.id, success: false, error: "Pot not found" });
      continue;
    }

    const { data: account, error: accountError } = await supabase
      .from("monzo_accounts")
      .select("account_id, access_token, refresh_token, token_expiry")
      .eq("id", pot.monzo_account_id)
      .single();

    if (accountError || !account) {
      results.push({ id: automation.id, success: false, error: "Monzo account not found" });
      continue;
    }

    let accessToken = account.access_token;
    const accountId = account.account_id;
    const potId = pot.pot_id;

    try {
      const expiry = account.token_expiry
        ? new Date(account.token_expiry).getTime()
        : 0;
      if (Date.now() >= expiry - 60_000) {
        const tokens = await refreshMonzoToken(account.refresh_token);
        accessToken = tokens.access_token;
        await supabase
          .from("monzo_accounts")
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token ?? account.refresh_token,
            token_expiry: new Date(
              Date.now() + (tokens.expires_in ?? 3600) * 1000
            ).toISOString(),
          })
          .eq("id", pot.monzo_account_id);
      }

      const balanceData = await fetchMonzoBalance(accessToken, accountId);
      const availableBalance = balanceData.balance ?? 0;
      if (availableBalance < automation.amount) {
        const nextRunAt = computeNextRunAt(
          automation.frequency as "weekly" | "monthly",
          automation.day_of_week,
          automation.day_of_month
        );
        await supabase
          .from("automations")
          .update({
            next_run_at: nextRunAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", automation.id);
        results.push({
          id: automation.id,
          success: false,
          error: `Insufficient funds: ${availableBalance} available, ${automation.amount} required`,
        });
        continue;
      }

      const dedupeId = `automation-${automation.id}-${automation.next_run_at ?? now}`;
      await depositIntoMonzoPot(
        accessToken,
        potId,
        accountId,
        automation.amount,
        dedupeId
      );

      const nextRunAt = computeNextRunAt(
        automation.frequency as "weekly" | "monthly",
        automation.day_of_week,
        automation.day_of_month
      );

      await supabase
        .from("automations")
        .update({
          next_run_at: nextRunAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", automation.id);

      results.push({ id: automation.id, success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[run-automations] Automation failed:", automation.id, err);
      results.push({ id: automation.id, success: false, error: msg });
    }
  }

  return NextResponse.json({
    ran: results.length,
    results,
  });
}
