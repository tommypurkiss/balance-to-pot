-- Temporary storage for Monzo tokens while waiting for in-app approval (SCA).
-- Rows are deleted after sync or after ~5 min TTL.
CREATE TABLE IF NOT EXISTS monzo_pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE monzo_pending_approvals ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (admin client) accesses this table.
-- Anon users cannot read/write.

CREATE INDEX idx_monzo_pending_created ON monzo_pending_approvals(created_at);
