"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { useAutomations } from "@/hooks/useAutomations";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Wallet, PiggyBank, CreditCard } from "lucide-react";

export function DashboardPage() {
  const { data: monzoAccounts = [], isLoading: accountsLoading } =
    useMonzoAccounts();
  const { data: automations = [], isLoading: automationsLoading } =
    useAutomations();

  const totalBalance = monzoAccounts.reduce((sum, a) => sum + a.balance, 0);
  const potCount = monzoAccounts.reduce(
    (sum, a) => sum + (a.monzo_pots?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your accounts and automations
          </p>
        </div>

        {!accountsLoading && monzoAccounts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total balance
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <PiggyBank className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pots</p>
                    <p className="text-2xl font-bold">{potCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Automations</p>
                    <p className="text-2xl font-bold">
                      {automationsLoading ? "…" : automations.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <p className="text-muted-foreground text-sm">
              Manage your accounts and set up automatic transfers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/accounts">View Accounts</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/automations">View Automations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
