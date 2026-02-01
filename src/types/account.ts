export interface MonzoAccount {
  id: string;
  user_id?: string;
  account_id: string;
  account_name: string;
  account_type: "current" | "flex" | "savings" | string;
  balance: number;
  connected_at: string;
  last_synced: string | null;
  reconnect_by: string;
  is_active: boolean;
}

export interface MonzoPot {
  id: string;
  monzo_account_id?: string;
  pot_id: string;
  pot_name: string;
  balance: number;
  created_at?: string;
  last_synced: string | null;
}

export interface CreditCard {
  id: string;
  user_id: string;
  provider_id: string;
  account_id: string;
  provider_name: string;
  card_name: string;
  last_four_digits: string;
  current_balance: number;
  available_credit: number;
  credit_limit: number;
  connected_at: string;
  last_synced: string | null;
  reconnect_by: string;
  days_until_reconnect: number;
  is_active: boolean;
  is_supported: boolean;
}
