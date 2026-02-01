"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CreditCard } from "@/types/account";

export function useCreditCards() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("connected_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as CreditCard[];
    },
  });
}
