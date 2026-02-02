"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { MonzoAccount } from "@/types/account";
import { CreditCard as CreditCardIcon } from "lucide-react";

interface MonzoFlexCardProps {
  account: MonzoAccount;
}

export function MonzoFlexCard({ account }: MonzoFlexCardProps) {
  const debt = account.balance < 0 ? -account.balance : 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="pt-6 pb-6 pl-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CreditCardIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">Monzo Flex</h3>
                <Badge
                  variant="secondary"
                  className="mt-0.5 text-xs font-normal"
                >
                  Monzo
                </Badge>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(debt)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {account.last_synced
                  ? `Synced ${new Date(
                      account.last_synced
                    ).toLocaleDateString()}`
                  : "Never synced"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
