"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MonzoAccountCard } from "@/components/accounts/monzo-account-card";
import { ConnectMonzoDialog } from "@/components/accounts/connect-monzo-dialog";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { CreditCard, Loader2, Wallet } from "lucide-react";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 90000; // 90 seconds

export function AccountsPage() {
  const searchParams = useSearchParams();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [pendingTimedOut, setPendingTimedOut] = useState(false);
  const [pollRetryKey, setPollRetryKey] = useState(0);
  const pollStartRef = useRef<number | null>(null);
  const {
    data: monzoAccounts = [],
    isLoading,
    error,
    refetch,
  } = useMonzoAccounts();

  const monzoConnected = searchParams?.get("monzo") === "connected";
  const monzoPendingApproval =
    searchParams?.get("monzo") === "pending_approval";
  const pendingId = searchParams?.get("pending_id");
  const errorParam = searchParams?.get("error");

  useEffect(() => {
    if (monzoConnected || (errorParam && !monzoPendingApproval)) {
      refetch();
      window.history.replaceState({}, "", "/dashboard/accounts");
    }
  }, [monzoConnected, errorParam, monzoPendingApproval, refetch]);

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <Button onClick={() => setConnectDialogOpen(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Monzo
          </Button>
        </div>

        <ConnectMonzoDialog
          open={connectDialogOpen}
          onOpenChange={setConnectDialogOpen}
        />

        {monzoConnected && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            Monzo account connected successfully!
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
            Connection failed: {decodeURIComponent(errorParam as string)}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Monzo Accounts</h2>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-8 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-2/3" />
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
            ) : monzoAccounts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    Connect your Monzo account to view your accounts and pots.
                  </p>
                  <Button onClick={() => setConnectDialogOpen(true)}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Monzo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {monzoAccounts.map((account) => (
                  <MonzoAccountCard
                    key={account.id}
                    account={account}
                    onReconnect={() => setConnectDialogOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Credit Cards</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Connect your credit cards via TrueLayer. Coming in Phase 3.
                </p>
                <Button variant="outline" disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Credit Card (Phase 3)
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
