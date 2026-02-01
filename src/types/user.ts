export interface UserProfile {
  id: string;
  is_pro: boolean;
  subscription_status: "active" | "cancelled" | "past_due" | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  onboarding_step: number;
}

export interface ProStatus {
  isPro: boolean;
  automationLimit: number;
  cardsPerAutomationLimit: number;
}
