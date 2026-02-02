/**
 * Derives the effective account type for a Monzo account.
 * Handles legacy "other" data by detecting Flex/Rewards from account_name (Monzo description).
 */
export function getEffectiveAccountType(a: {
  account_type?: string | null;
  account_name?: string | null;
}): "current" | "flex" | "rewards" | "other" {
  if (a.account_type === "current" || a.account_type === "flex" || a.account_type === "rewards") {
    return a.account_type;
  }
  // Fallback for existing "other" data - Monzo stores description as account_name
  const name = (a.account_name ?? "").toLowerCase();
  if (name.includes("monzoflex")) return "flex";
  if (name.includes("rewardsoptin")) return "rewards";
  return (a.account_type as "other") ?? "other";
}

export function isMainAccount(a: { account_type?: string | null; account_name?: string | null }) {
  return getEffectiveAccountType(a) === "current";
}

export function isFlexAccount(a: { account_type?: string | null; account_name?: string | null }) {
  return getEffectiveAccountType(a) === "flex";
}

export function isRewardsAccount(a: {
  account_type?: string | null;
  account_name?: string | null;
}) {
  return getEffectiveAccountType(a) === "rewards";
}
