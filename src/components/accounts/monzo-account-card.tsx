"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  getDaysUntilReconnection,
  getReconnectionStatus,
} from "@/lib/utils/reconnection";
import type { MonzoAccount, MonzoPot } from "@/types/account";
import { RefreshCw, Link2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function getFriendlyAccountName(account: MonzoAccount): string {
  const name = account.account_name;
  const id = account.account_id;
  if (id.startsWith("user_") && account.account_type === "current") {
    return name && !name.startsWith("user_") ? name : "Current Account";
  }
  if (id.startsWith("monzoflex_")) return "Flex Account";
  if (id.startsWith("rewardsoptin_")) return "Rewards";
  if (name && !/^[a-z]+_[a-zA-Z0-9]+$/.test(name)) return name;
  return account.account_type === "current"
    ? "Current Account"
    : `${account.account_type} Account`;
}

interface MonzoAccountCardProps {
  account: MonzoAccount & { monzo_pots?: MonzoPot[] };
  onReconnect?: () => void;
}

export function MonzoAccountCard({
  account,
  onReconnect,
}: MonzoAccountCardProps) {
  const daysUntilReconnect = getDaysUntilReconnection(account.reconnect_by);
  const reconnectStatus = getReconnectionStatus(daysUntilReconnect);
  const displayName = getFriendlyAccountName(account);
  const isCurrentAccount = account.account_type === "current";

  const statusColors = {
    safe: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    urgent: "text-red-600 dark:text-red-400",
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg",
        isCurrentAccount && "ring-1 ring-primary/20"
      )}
    >
      <div className="relative">
        {isCurrentAccount && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
        )}
        <CardContent className="pt-6 pb-6 pl-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{displayName}</h3>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 text-xs font-normal capitalize"
                  >
                    {account.account_type}
                  </Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(account.balance)}
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

            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Reconnect in</span>
              <span
                className={cn("font-medium", statusColors[reconnectStatus])}
              >
                {daysUntilReconnect} days
              </span>
            </div>

            {account.monzo_pots && account.monzo_pots.length > 0 && (
              <Accordion
                type="single"
                collapsible
                className="pt-2 border-t border-border/50"
              >
                <AccordionItem value="pots" className="border-0">
                  <AccordionTrigger className="py-2 px-0 hover:no-underline">
                    <span className="text-sm font-medium text-muted-foreground">
                      Pots ({account.monzo_pots.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-0">
                    <ul className="space-y-2">
                      {account.monzo_pots.map((pot) => (
                        <li
                          key={pot.id}
                          className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm truncate">
                            {pot.pot_name}
                          </span>
                          <span className="text-sm font-semibold tabular-nums shrink-0">
                            {formatCurrency(pot.balance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <div className="flex gap-2 pt-2">
              {daysUntilReconnect <= 10 &&
                (onReconnect ? (
                  <Button variant="outline" size="sm" onClick={onReconnect}>
                    <Link2 className="h-4 w-4 mr-1.5" />
                    Reconnect
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api/auth/monzo/connect">
                      <Link2 className="h-4 w-4 mr-1.5" />
                      Reconnect
                    </a>
                  </Button>
                ))}
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="Sync coming soon"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Sync Now
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
