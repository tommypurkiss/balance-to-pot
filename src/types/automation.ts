export interface Automation {
  id: string;
  user_id: string;
  name: string;
  source_credit_card_id: string | null;
  destination_monzo_pot_id: string;
  amount: number;
  frequency: "weekly" | "monthly";
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
  destination_pot?: { pot_name: string };
  source_card?: { card_name: string; last_four_digits: string };
}

export interface CreateAutomationInput {
  name: string;
  source_credit_card_id?: string | null;
  destination_monzo_pot_id: string;
  amount: number;
  frequency: "weekly" | "monthly";
  day_of_week?: number;
  day_of_month?: number;
}
