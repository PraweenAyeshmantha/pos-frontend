export interface LoyaltyTier {
  id?: number;
  name: string;
  description?: string;
  minPoints: number;
  maxPoints?: number | null;
  priority: number;
  earnMultiplier: number;
  burnMultiplier: number;
  recordStatus?: string;
}

export type LoyaltyRuleType = 'EARN' | 'BURN';

export interface LoyaltyRule {
  id?: number;
  ruleType: LoyaltyRuleType;
  pointsPerCurrency?: number;
  currencyPerPoint?: number;
  minOrderTotal?: number;
  maxPointsPerOrder?: number;
  expirationDays?: number;
  minPointsToRedeem?: number;
  maxPointsToRedeem?: number;
}

export interface LoyaltyReward {
  id?: number;
  name: string;
  description?: string;
  pointsCost: number;
  monetaryValue?: number;
  autoIssue?: boolean;
  expiresAt?: string | null;
  recordStatus?: string;
}

export interface LoyaltyTransactionSummary {
  type: string;
  points: number;
  description?: string;
  createdDate?: string;
  expiresAt?: string | null;
}

export interface LoyaltySummary {
  customerId: number;
  availablePoints: number;
  tierName: string;
  nextTierAt?: number | null;
  pointsToNextTier?: number | null;
  expiringPoints?: number | null;
  expiringOn?: string | null;
  lifetimePointsEarned?: number;
  lifetimePointsRedeemed?: number;
  rewards: Array<{
    id: number;
    name: string;
    description?: string;
    pointsCost: number;
  }>;
  recentTransactions: LoyaltyTransactionSummary[];
}

export interface LoyaltyRedemptionRequest {
  points?: number;
  rewardId?: number;
  reason?: string;
}
