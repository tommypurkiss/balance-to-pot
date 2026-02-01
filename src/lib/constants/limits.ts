export const FREE_TIER = {
  maxAutomations: 1,
  maxCardsPerAutomation: 1,
} as const;

export const PRO_TIER = {
  maxAutomations: Infinity,
  maxCardsPerAutomation: 10,
} as const;
