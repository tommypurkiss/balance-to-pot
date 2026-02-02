"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MonzoAccountCard } from "@/components/accounts/monzo-account-card";
import { MonzoFlexCard } from "@/components/accounts/monzo-flex-card";
import { CreditCardCard } from "@/components/accounts/credit-card-card";
import { ConnectMonzoDialog } from "@/components/accounts/connect-monzo-dialog";
import { ConnectCreditCardDialog } from "@/components/accounts/connect-credit-card-dialog";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { useCreditCards } from "@/hooks/useCreditCards";
import {
  isMainAccount,
  isFlexAccount,
  isRewardsAccount,
} from "@/lib/utils/monzoAccountType";
import { CreditCard, Loader2, Wallet } from "lucide-react";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 90000; // 90 seconds

export function AccountsPage() {
  const searchParams = useSearchParams();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectCreditCardOpen, setConnectCreditCardOpen] = useState(false);
  const [pendingTimedOut, setPendingTimedOut] = useState(false);
  const [pollRetryKey, setPollRetryKey] = useState(0);
  const pollStartRef = useRef<number | null>(null);
  const {
    data: monzoAccounts = [],
    isLoading,
    error,
    refetch,
  } = useMonzoAccounts();
  const {
    data: creditCards = [],
    isLoading: creditCardsLoading,
    refetch: refetchCreditCards,
  } = useCreditCards();

  const mainAccounts = monzoAccounts.filter(isMainAccount);
  const flexAccounts = monzoAccounts.filter(isFlexAccount);
  const rewardsAccounts = monzoAccounts.filter(isRewardsAccount);

  useEffect(() => {
    if (monzoAccounts.length > 0) {
      console.log(
        "[Accounts] Monzo accounts (from DB) – use these for account_id detection:",
        monzoAccounts.map((a) => ({
          id: a.id,
          account_id: a.account_id,
          account_type: a.account_type,
          account_name: a.account_name,
          balance: a.balance,
          balanceFormatted: `£${(a.balance / 100).toFixed(2)}`,
          connected_at: a.connected_at,
          last_synced: a.last_synced,
        }))
      );
    }
  }, [monzoAccounts]);

  const monzoConnected = searchParams?.get("monzo") === "connected";
  const truelayerConnected = searchParams?.get("truelayer") === "connected";
  const monzoPendingApproval =
    searchParams?.get("monzo") === "pending_approval";
  const pendingId = searchParams?.get("pending_id");
  const errorParam = searchParams?.get("error");
  const truelayerDebugParam = searchParams?.get("truelayer_debug");
  const [truelayerDebugData, setTruelayerDebugData] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    if (truelayerDebugParam) {
      try {
        const decoded = JSON.parse(
          atob(truelayerDebugParam.replace(/-/g, "+").replace(/_/g, "/"))
        ) as Record<string, unknown>;
        setTruelayerDebugData(decoded);
      } catch {
        setTruelayerDebugData({ error: "Failed to decode debug data" });
      }
    }
  }, [truelayerDebugParam]);

  useEffect(() => {
    if (
      monzoConnected ||
      truelayerConnected ||
      (errorParam && !monzoPendingApproval)
    ) {
      refetch();
      refetchCreditCards();
      window.history.replaceState({}, "", "/dashboard/accounts");
    }
  }, [
    monzoConnected,
    truelayerConnected,
    errorParam,
    monzoPendingApproval,
    refetch,
    refetchCreditCards,
  ]);

  useEffect(() => {
    if (!monzoPendingApproval || !pendingId) return;

    setPendingTimedOut(false);

    const checkAccess = async () => {
      const res = await fetch(
        `/api/auth/monzo/verify-pending?pending_id=${encodeURIComponent(
          pendingId
        )}`
      );
      const data = await res.json();

      if (data.success) {
        window.history.replaceState(
          {},
          "",
          "/dashboard/accounts?monzo=connected"
        );
        refetch();
        return true;
      }
      if (
        data.error === "pending_not_found" ||
        data.error === "token_expired"
      ) {
        window.history.replaceState(
          {},
          "",
          "/dashboard/accounts?error=monzo_pending_approval"
        );
        return true;
      }
      return false;
    };

    const poll = async () => {
      if (pollStartRef.current === null) {
        pollStartRef.current = Date.now();
      }
      const elapsed = Date.now() - pollStartRef.current;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setPendingTimedOut(true);
        return;
      }

      const done = await checkAccess();
      if (!done) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      pollStartRef.current = null;
    };
  }, [monzoPendingApproval, pendingId, refetch, pollRetryKey]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Accounts
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect and manage your bank accounts
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Monzo
            </Button>
            <Button
              variant="outline"
              onClick={() => setConnectCreditCardOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Connect Credit Card
            </Button>
          </div>
        </div>

        <ConnectMonzoDialog
          open={connectDialogOpen}
          onOpenChange={setConnectDialogOpen}
        />
        <ConnectCreditCardDialog
          open={connectCreditCardOpen}
          onOpenChange={setConnectCreditCardOpen}
        />

        {monzoConnected && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">Monzo connected successfully</p>
              <p className="text-sm opacity-90">
                Your accounts and pots are now synced
              </p>
            </div>
          </div>
        )}

        {truelayerConnected && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">Credit card connected successfully</p>
              <p className="text-sm opacity-90">
                Your credit card balance is now synced
              </p>
            </div>
          </div>
        )}

        {truelayerDebugData && (
          <div className="mb-6 p-4 rounded-xl bg-slate-500/10 dark:bg-slate-600/10 border border-slate-500/20 dark:border-slate-600/20">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">TrueLayer debug (dev only)</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTruelayerDebugData(null)}
              >
                Dismiss
              </Button>
            </div>
            <pre className="text-xs overflow-auto max-h-64 p-3 rounded bg-slate-900/50 text-slate-100 font-mono">
              {JSON.stringify(truelayerDebugData, null, 2)}
            </pre>
          </div>
        )}

        {monzoPendingApproval && pendingId && !pendingTimedOut && (
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              <div>
                <p className="font-medium">
                  Waiting for approval in your Monzo app
                </p>
                <p className="text-sm mt-1">
                  Check your phone for a notification, approve with PIN or Face
                  ID. We&apos;ll connect automatically once you approve.
                </p>
              </div>
            </div>
          </div>
        )}

        {monzoPendingApproval && pendingTimedOut && (
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <p className="font-medium mb-2">Still waiting?</p>
            <p className="text-sm mb-4">
              Approve the connection in your Monzo app, then click below to
              retry.
            </p>
            <Button
              onClick={() => {
                setPollRetryKey((k) => k + 1);
              }}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Check again
            </Button>
          </div>
        )}

        {errorParam === "monzo_pending_approval" && !monzoPendingApproval && (
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <p className="font-medium mb-2">
              Almost there – approve in your Monzo app
            </p>
            <p className="text-sm mb-4">
              You&apos;ve signed in with Monzo, but you need to approve the
              connection in your Monzo app. Check your phone for a notification,
              enter your PIN or use Face ID, then approve access.
            </p>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        )}

        {errorParam && errorParam !== "monzo_pending_approval" && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <p className="font-medium">Connection failed</p>
            <p className="text-sm mt-1">
              {errorParam === "access_denied"
                ? "You declined access. Try again when you're ready to connect."
                : errorParam === "invalid_state"
                ? "Session expired. Please try connecting again."
                : errorParam === "missing_params"
                ? "Invalid callback. Please try connecting again."
                : decodeURIComponent(errorParam as string)}
            </p>
          </div>
        )}

        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Monzo Accounts</h2>
            </div>
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6 pb-6">
                      <div className="animate-pulse space-y-5">
                        <div className="flex justify-between">
                          <div className="flex gap-2">
                            <div className="h-10 w-10 rounded-lg bg-muted" />
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-24" />
                              <div className="h-5 bg-muted rounded w-16" />
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded w-20" />
                        </div>
                        <div className="h-10 bg-muted rounded-lg" />
                        <div className="h-10 bg-muted rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    {error instanceof Error
                      ? error.message
                      : "Failed to load accounts"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : mainAccounts.length === 0 &&
              flexAccounts.length === 0 &&
              rewardsAccounts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    No Monzo accounts connected
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Connect your Monzo account to view balances, pots, and
                    manage your finances in one place.
                  </p>
                  <Button onClick={() => setConnectDialogOpen(true)}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Monzo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {mainAccounts.map((account, i) => (
                  <MonzoAccountCard
                    key={account.id}
                    account={account}
                    rewardsAccounts={i === 0 ? rewardsAccounts : []}
                    onReconnect={() => setConnectDialogOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Credit Cards</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnectCreditCardOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Credit Card
              </Button>
            </div>
            {creditCardsLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6 pb-6">
                      <div className="animate-pulse space-y-5">
                        <div className="flex justify-between">
                          <div className="h-10 w-10 rounded-lg bg-muted" />
                          <div className="h-8 bg-muted rounded w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : creditCards.length === 0 && flexAccounts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">No credit cards connected</p>
                      <p className="text-sm text-muted-foreground">
                        Connect credit cards via TrueLayer to track balances
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setConnectCreditCardOpen(true)}
                    className="shrink-0"
                  >
                    Connect Credit Card
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {flexAccounts.map((account) => (
                  <MonzoFlexCard key={account.id} account={account} />
                ))}
                {creditCards.map((card) => (
                  <CreditCardCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-10 pt-6 border-t">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
