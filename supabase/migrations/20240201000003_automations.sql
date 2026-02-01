-- credit_cards table (Phase 3 - TrueLayer, placeholder for now)
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  provider_name TEXT,
  card_name TEXT,
  last_four_digits TEXT,
  current_balance INTEGER DEFAULT 0,
  available_credit INTEGER DEFAULT 0,
  credit_limit INTEGER DEFAULT 0,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ,
  reconnect_by DATE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, account_id)
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_cards_policy ON credit_cards
  FOR ALL USING (auth.uid() = user_id);

-- Automation rules: transfer from credit card to Monzo pot
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  destination_monzo_pot_id UUID NOT NULL REFERENCES monzo_pots(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT automation_schedule_check CHECK (
    (frequency = 'weekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
    (frequency = 'monthly' AND day_of_month IS NOT NULL AND day_of_week IS NULL)
  )
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY automations_policy ON automations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_automations_user ON automations(user_id);
CREATE INDEX idx_automations_next_run ON automations(next_run_at) WHERE is_active;
