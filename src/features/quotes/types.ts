export type SecondaryDiscount = "single-occupancy" | "two-week" | "four-week" | "early-bird" | null;

export interface QuoteInput {
  arrival: string;
  departure: string;
  adults: number;
  childrenSixToSeventeen: number;
  childrenUnderSix: number;
  secondaryDiscounts?: Exclude<SecondaryDiscount, null>[];
}

export interface QuoteCalculation {
  nights: number;
  guests: number;
  levyGuests: number;
  accommodation: number;
  rateBreakdown: Array<{ period: string; nights: number; rate: number; total: number }>;
  longStayDiscount: number;
  secondaryDiscount: number;
  secondaryDiscountType: SecondaryDiscount;
  discountedAccommodation: number;
  shortStayLevy: number;
  abst: number;
  governmentLevy: number;
  fees: number;
  quotationTotal: number;
  securityDeposit: number;
  dueToConfirm: number;
  balanceDue: number;
  balanceDueDaysBeforeArrival: number;
  balanceDueDate?: string;
}
