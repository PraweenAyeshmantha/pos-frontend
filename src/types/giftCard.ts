export type GiftCardStatus =
  | 'ISSUED'
  | 'ACTIVE'
  | 'PARTIALLY_REDEEMED'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'CANCELLED';

export type GiftCardType = 'GIFT_CARD' | 'STORE_CREDIT';

export interface GiftCardTransaction {
  id: number;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  orderNumber?: string | null;
}

export interface GiftCardListItem {
  id: number;
  code: string;
  cardType: GiftCardType;
  status: GiftCardStatus;
  initialValue: number;
  currentBalance: number;
  currency: string;
  issuedDate: string;
  activatedDate?: string | null;
  expirationDate?: string | null;
  lastTransactionDate?: string | null;
  customerName?: string | null;
  notes?: string | null;
  reloadable?: boolean;
}

export interface GiftCardDetail extends GiftCardListItem {
  customerId?: number | null;
  transactions: GiftCardTransaction[];
}

export interface GiftCardBreakageCard {
  giftCardId: number;
  code: string;
  cardType: GiftCardType;
  status: GiftCardStatus;
  outstandingBalance: number;
  lastTransactionDate?: string | null;
  eligibleDate: string;
}

export interface GiftCardBreakageSummary {
  cards: GiftCardBreakageCard[];
  totalBreakage: number;
  inactivityDays: number;
  asOfDate: string;
}

export interface GiftCardLookupResponse {
  id: number;
  code: string;
  cardType: GiftCardType;
  status: GiftCardStatus;
  currentBalance: number;
  initialValue: number;
  expirationDate?: string | null;
  redeemable: boolean;
  message: string;
}

export interface GiftCardIssuePayload {
  amount: number;
  expirationDate?: string | null;
  activateNow?: boolean;
  code?: string;
  currency?: string;
  customerId?: number;
  cashierId?: number;
  orderId?: number;
  orderNumber?: string;
  notes?: string;
  reloadable?: boolean;
  cardType?: GiftCardType;
}

export interface GiftCardActivationPayload {
  activationDate?: string;
  amount?: number;
  notes?: string;
}

export interface GiftCardAdjustmentPayload {
  amount: number;
  reason?: string;
}
