"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MonzoAccountCard } from "@/components/accounts/monzo-account-card";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { CreditCard, Wallet } from "lucide-react";

export function AccountsPage() {
  const searchParams = useSearchParams();
  const {
    data: monzoAccounts = [],
    isLoading,
    error,
    refetch,
  } = useMonzoAccounts();

  const monzoConnected = searchParams?.get("monzo") === "connected";
  const errorParam = searchParams?.get("error");

  useEffect(() => {
    if (monzoConnected || errorParam) {
      refetch();
      window.history.replaceState({}, "", "/dashboard/accounts");
    }
  }, [monzoConnected, errorParam, refetch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <Button asChild>
            <a href="/api/auth/monzo/connect">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Monzo
            </a>
          </Button>
        </div>

        {monzoConnected && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            Monzo account connected successfully!
          </div>
        )}

        {errorParam && (
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
                  <Button asChild>
                    <a href="/api/auth/monzo/connect">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Monzo
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {monzoAccounts.map((account) => (
                  <MonzoAccountCard key={account.id} account={account} />
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
