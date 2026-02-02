-- Backfill account_type for existing Monzo accounts stored as "other"
-- Monzo Flex: account_name contains monzoflex
-- Rewards: account_name contains rewardsoptin

UPDATE monzo_accounts
SET account_type = 'flex'
WHERE account_type = 'other'
  AND LOWER(account_name) LIKE '%monzoflex%';

UPDATE monzo_accounts
SET account_type = 'rewards'
WHERE account_type = 'other'
  AND LOWER(account_name) LIKE '%rewardsoptin%';
