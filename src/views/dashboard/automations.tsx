"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAutomations,
  useCreateAutomation,
  useToggleAutomation,
  useDeleteAutomation,
} from "@/hooks/useAutomations";
import { useMonzoAccounts } from "@/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { MonzoPot } from "@/types/account";
import type { CreateAutomationInput } from "@/types/automation";
import { CreditCard, Plus, Trash2, PiggyBank } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getPotName(
  potId: string,
  monzoAccounts: { monzo_pots?: MonzoPot[] }[]
): string {
  for (const account of monzoAccounts) {
    const pot = account.monzo_pots?.find((p) => p.id === potId);
    if (pot) return pot.pot_name;
  }
  return "Unknown pot";
}

export function AutomationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<
    CreateAutomationInput & { amountPounds: string }
  >({
    name: "",
    destination_monzo_pot_id: "",
    amount: 0,
    amountPounds: "",
    frequency: "monthly",
    day_of_month: 1,
  });

  const { data: automations = [], isLoading, error } = useAutomations();
  const { data: monzoAccounts = [] } = useMonzoAccounts();
  const createMutation = useCreateAutomation();
  const toggleMutation = useToggleAutomation();
  const deleteMutation = useDeleteAutomation();

  const allPots = monzoAccounts.flatMap((a) =>
    (a.monzo_pots ?? []).map((p) => ({ ...p, accountName: a.account_name }))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPennies = Math.round(
      parseFloat(form.amountPounds || "0") * 100
    );
    if (!form.destination_monzo_pot_id || amountPennies <= 0) return;

    try {
      await createMutation.mutateAsync({
        name: form.name,
        destination_monzo_pot_id: form.destination_monzo_pot_id,
        amount: amountPennies,
        frequency: form.frequency,
        day_of_week: form.frequency === "weekly" ? form.day_of_week : undefined,
        day_of_month:
          form.frequency === "monthly" ? form.day_of_month : undefined,
      });
      setCreateOpen(false);
      setForm({
        name: "",
        destination_monzo_pot_id: "",
        amount: 0,
        amountPounds: "",
        frequency: "monthly",
        day_of_month: 1,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Automations
            </h1>
            <p className="text-muted-foreground mt-1">
              Schedule transfers from credit cards to Monzo pots
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={allPots.length === 0}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create automation
          </Button>
        </div>

        {allPots.length === 0 && (
          <Card className="mb-6 border-dashed">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <PiggyBank className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">
                    Connect Monzo to create automations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You need at least one Monzo account with pots to set up
                    automatic transfers.
                  </p>
                  <Button asChild className="mt-3">
                    <Link href="/dashboard/accounts">Connect Monzo</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Failed to load"}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : automations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No automations yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create an automation to transfer money from a credit card to a
                Monzo pot on a schedule. Connect a credit card (Phase 3) to
                activate.
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={allPots.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create automation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(automation.amount)} →{" "}
                          {getPotName(
                            automation.destination_monzo_pot_id,
                            monzoAccounts
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              automation.is_active ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {automation.frequency === "weekly"
                              ? `Weekly (${DAYS[automation.day_of_week ?? 0]})`
                              : `Monthly (day ${automation.day_of_month})`}
                          </Badge>
                          {!automation.source_credit_card_id && (
                            <Badge variant="outline" className="text-xs">
                              Connect card to activate
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: automation.id,
                            is_active: !automation.is_active,
                          })
                        }
                        disabled={toggleMutation.isPending}
                      >
                        {automation.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(automation.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create automation</DialogTitle>
            <DialogDescription>
              Transfer money from a credit card to a Monzo pot on a schedule.
              Credit card connection coming in Phase 3.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Monthly rent transfer"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination pot</Label>
              <select
                id="destination"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.destination_monzo_pot_id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    destination_monzo_pot_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select a pot</option>
                {allPots.map((pot) => (
                  <option key={pot.id} value={pot.id}>
                    {pot.pot_name} ({formatCurrency(pot.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amountPounds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountPounds: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={form.frequency === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      frequency: "weekly",
                      day_of_week: 1,
                      day_of_month: undefined,
                    }))
                  }
                >
                  Weekly
                </Button>
                <Button
                  type="button"
                  variant={form.frequency === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      frequency: "monthly",
                      day_of_month: 1,
                      day_of_week: undefined,
                    }))
                  }
                >
                  Monthly
                </Button>
              </div>
            </div>
            {form.frequency === "weekly" && (
              <div>
                <Label>Day of week</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                  value={form.day_of_week ?? 1}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      day_of_week: parseInt(e.target.value, 10),
                    }))
                  }
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {form.frequency === "monthly" && (
              <div>
                <Label>Day of month</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={form.day_of_month ?? 1}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      day_of_month: parseInt(e.target.value || "1", 10),
                    }))
                  }
                />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !form.destination_monzo_pot_id ||
                  !form.amountPounds ||
                  parseFloat(form.amountPounds || "0") <= 0
                }
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
