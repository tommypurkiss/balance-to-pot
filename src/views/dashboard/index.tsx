"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { useAutomations } from "@/hooks/useAutomations";
import { useCreditCards } from "@/hooks/useCreditCards";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { isMainAccount, isFlexAccount } from "@/lib/utils/monzoAccountType";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Zap,
  Banknote,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const MetricCard = ({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconClassName: string;
}) => (
  <Card className="group transition-all duration-200 hover:shadow-lg hover:border-border/80 hover:-translate-y-0.5 overflow-hidden">
    <CardContent className="p-8">
      <div className="flex flex-col gap-5">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors ${iconClassName}`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight whitespace-nowrap">
            {value}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function DashboardPage() {
  const { data: monzoAccounts = [], isLoading: accountsLoading } =
    useMonzoAccounts();
  const { data: automations = [], isLoading: automationsLoading } =
    useAutomations();
  const { data: creditCards = [], isLoading: cardsLoading } = useCreditCards();

  const mainBankAccounts = monzoAccounts.filter(isMainAccount);
  const flexAccounts = monzoAccounts.filter(isFlexAccount);

  const totalBalance = mainBankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const potCount = monzoAccounts.reduce(
    (sum, a) => sum + (a.monzo_pots?.length ?? 0),
    0
  );
  const totalPotBalance = monzoAccounts.reduce(
    (sum, a) =>
      sum + (a.monzo_pots?.reduce((p, pot) => p + pot.balance, 0) ?? 0),
    0
  );
  const creditCardDebtFromTrueLayer = creditCards.reduce(
    (sum, c) => sum + c.current_balance,
    0
  );
  const flexDebt = flexAccounts.reduce(
    (sum, a) => sum + (a.balance < 0 ? -a.balance : 0),
    0
  );
  const totalCreditCardDebt = creditCardDebtFromTrueLayer + flexDebt;
  const activeAutomations = automations.filter((a) => a.is_active);
  const monthlyTransferTarget = activeAutomations.reduce((sum, a) => {
    if (a.frequency === "monthly") return sum + a.amount;
    return sum + a.amount * 4; // weekly × 4 ≈ monthly
  }, 0);

  const isLoading = accountsLoading || automationsLoading || cardsLoading;
  const hasAnyData =
    monzoAccounts.length > 0 ||
    creditCards.length > 0 ||
    automations.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1.5 text-base">
            Overview of your accounts and automations
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <div className="flex flex-col gap-5">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                      <div className="h-9 w-24 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && hasAnyData && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            <MetricCard
              icon={Wallet}
              label="Monzo balance"
              value={formatCurrency(totalBalance)}
              iconClassName="bg-primary/10 text-primary"
            />
            <MetricCard
              icon={PiggyBank}
              label="Pot savings"
              value={formatCurrency(totalPotBalance)}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              icon={Banknote}
              label="Pots"
              value={potCount}
              iconClassName="bg-muted text-muted-foreground"
            />
            <MetricCard
              icon={CreditCard}
              label="Credit card debt"
              value={formatCurrency(totalCreditCardDebt)}
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <MetricCard
              icon={Zap}
              label="Automations"
              value={
                <>
                  {activeAutomations.length}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {automations.length}
                  </span>
                </>
              }
              iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
            <MetricCard
              icon={TrendingUp}
              label="Monthly target"
              value={formatCurrency(monthlyTransferTarget)}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
          </div>
        )}

        {!isLoading && !hasAnyData && (
          <Card className="mb-10 border-dashed bg-muted/30">
            <CardContent className="pt-8 pb-8">
              <p className="text-muted-foreground text-center mb-6">
                Connect your Monzo account and credit cards to see your
                dashboard metrics.
              </p>
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link href="/dashboard/accounts">Connect accounts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4 pt-6 px-8">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your accounts and set up automatic transfers
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="group/btn">
                  <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center gap-2"
                  >
                    View Accounts
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard/automations">View Automations</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Tip</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automations run daily at 9am. Connect a credit card to
                    automatically move money into your pots.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
