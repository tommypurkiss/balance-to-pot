"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Automation, CreateAutomationInput } from "@/types/automation";
import { computeNextRunAt } from "@/lib/utils/nextRunAt";

export function useAutomations() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Automation[];
    },
  });
}

export function useCreateAutomation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAutomationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dayOfWeek =
        input.frequency === "weekly" ? input.day_of_week ?? 0 : null;
      const dayOfMonth =
        input.frequency === "monthly" ? input.day_of_month ?? 1 : null;
      const nextRunAt = computeNextRunAt(
        input.frequency,
        dayOfWeek,
        dayOfMonth
      );

      const payload = {
        user_id: user.id,
        name: input.name,
        source_credit_card_id: input.source_credit_card_id ?? null,
        destination_monzo_pot_id: input.destination_monzo_pot_id,
        amount: input.amount,
        frequency: input.frequency,
        day_of_week: input.frequency === "weekly" ? dayOfWeek : null,
        day_of_month: input.frequency === "monthly" ? dayOfMonth : null,
        next_run_at: nextRunAt.toISOString(),
      };

      const { data, error } = await supabase
        .from("automations")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useToggleAutomation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("automations")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useDeleteAutomation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}
