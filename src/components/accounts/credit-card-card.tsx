"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { CreditCard } from "@/types/account";
import { CreditCard as CreditCardIcon } from "lucide-react";

interface CreditCardCardProps {
  card: CreditCard;
}

export function CreditCardCard({ card }: CreditCardCardProps) {
  const displayName =
    card.card_name ||
    `${card.provider_name ?? "Card"} •••• ${card.last_four_digits ?? "****"}`;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="pt-6 pb-6 pl-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{displayName}</h3>
                <Badge
                  variant="secondary"
                  className="mt-0.5 text-xs font-normal"
                >
                  {card.provider_name ?? "Credit card"}
                </Badge>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(card.current_balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.credit_limit > 0
                  ? `${formatCurrency(card.available_credit)} available`
                  : card.last_synced
                  ? `Synced ${new Date(card.last_synced).toLocaleDateString()}`
                  : "Never synced"}
              </p>
            </div>
          </div>
          {card.credit_limit > 0 && (
            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Credit limit</span>
              <span className="font-medium">
                {formatCurrency(card.credit_limit)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
