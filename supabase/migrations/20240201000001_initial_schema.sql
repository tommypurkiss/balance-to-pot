-- Users profile (extends auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro BOOLEAN DEFAULT false,
  subscription_status TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_profile_policy ON users_profile
  FOR ALL USING (auth.uid() = id);

-- Monzo accounts
CREATE TABLE IF NOT EXISTS monzo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT UNIQUE NOT NULL,
  account_name TEXT,
  account_type TEXT,
  balance INTEGER DEFAULT 0,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ,
  reconnect_by DATE,
  is_active BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'daily'
);

ALTER TABLE monzo_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY monzo_accounts_policy ON monzo_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Monzo pots
CREATE TABLE IF NOT EXISTS monzo_pots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monzo_account_id UUID NOT NULL REFERENCES monzo_accounts(id) ON DELETE CASCADE,
  pot_id TEXT UNIQUE NOT NULL,
  pot_name TEXT,
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ
);

ALTER TABLE monzo_pots ENABLE ROW LEVEL SECURITY;

CREATE POLICY monzo_pots_policy ON monzo_pots
  FOR ALL USING (
    monzo_account_id IN (SELECT id FROM monzo_accounts WHERE user_id = auth.uid())
  );

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
