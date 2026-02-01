"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MonzoAccount, MonzoPot } from "@/types/account";

interface MonzoAccountWithPots extends MonzoAccount {
  monzo_pots: MonzoPot[];
}

export function useMonzoAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["monzo-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("monzo_accounts")
        .select(
          `
          id,
          account_id,
          account_name,
          account_type,
          balance,
          connected_at,
          last_synced,
          reconnect_by,
          is_active,
          monzo_pots (
            id,
            pot_id,
            pot_name,
            balance,
            last_synced
          )
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("connected_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as MonzoAccountWithPots[];
    },
  });
}
