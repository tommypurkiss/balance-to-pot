"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  getDaysUntilReconnection,
  getReconnectionStatus,
} from "@/lib/utils/reconnection";
import type { MonzoAccount, MonzoPot } from "@/types/account";
import { RefreshCw, Link2 } from "lucide-react";

interface MonzoAccountCardProps {
  account: MonzoAccount & { monzo_pots?: MonzoPot[] };
}

export function MonzoAccountCard({ account }: MonzoAccountCardProps) {
  const daysUntilReconnect = getDaysUntilReconnection(account.reconnect_by);
  const reconnectStatus = getReconnectionStatus(daysUntilReconnect);

  const statusColors = {
    safe: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <h3 className="font-semibold">{account.account_name}</h3>
          <Badge variant="secondary" className="mt-1 capitalize">
            {account.account_type}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {formatCurrency(account.balance)}
          </p>
          <p className="text-xs text-muted-foreground">
            Last synced:{" "}
            {account.last_synced
              ? new Date(account.last_synced).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reconnect in</span>
          <span className={statusColors[reconnectStatus]}>
            {daysUntilReconnect} days
          </span>
        </div>

        {account.monzo_pots && account.monzo_pots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Pots</h4>
            <ul className="space-y-1">
              {account.monzo_pots.map((pot) => (
                <li
                  key={pot.id}
                  className="flex justify-between text-sm py-1 px-2 rounded bg-muted/50"
                >
                  <span>{pot.pot_name}</span>
                  <span className="font-medium">
                    {formatCurrency(pot.balance)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          {daysUntilReconnect <= 10 && (
            <Button variant="outline" size="sm" asChild>
              <a href="/api/auth/monzo/connect">
                <Link2 className="h-4 w-4 mr-1" />
                Reconnect
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled title="Sync coming soon">
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
