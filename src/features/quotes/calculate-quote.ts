import type { QuoteCalculation, QuoteInput, SecondaryDiscount } from "./types";
import { PUBLISHED_RATE_BANDS } from "./published-rates";

const DAY_MS = 86_400_000;
const SECONDARY_PRIORITY: Exclude<SecondaryDiscount, null>[] = ["two-week", "four-week", "early-bird"];
const DISCOUNT_RATE: Record<Exclude<SecondaryDiscount, null>, number> = {
  "single-occupancy": 0.1,
  "two-week": 0.2,
  "four-week": 0.1,
  "early-bird": 0.1,
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function nightsBetween(arrival: string, departure: string) {
  return Math.round((parseDate(departure).getTime() - parseDate(arrival).getTime()) / DAY_MS);
}

function ratePeriod(date: Date) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const band = (month === 12 && day >= 18) || (month === 1 && day <= 3)
    ? PUBLISHED_RATE_BANDS.festive
    : (month === 5 && day >= 15) || (month > 5 && month < 11) || (month === 11 && day <= 15)
      ? PUBLISHED_RATE_BANDS.summer
      : month === 11 || month === 12
        ? PUBLISHED_RATE_BANDS.preFestive
        : PUBLISHED_RATE_BANDS.winterSpring;
  return { period: band.calculationPeriod, rate: band.nightlyRate };
}

function overlapsFestive(arrival: string, departure: string) {
  const nights = nightsBetween(arrival, departure);
  const start = parseDate(arrival);
  return Array.from({ length: Math.max(0, nights) }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return (month === 12 && day >= 18) || (month === 1 && day <= 3);
  }).some(Boolean);
}

export function validateQuoteRequest(input: QuoteInput): string | null {
  const nights = nightsBetween(input.arrival, input.departure);
  const guests = input.adults + input.childrenSixToSeventeen + input.childrenUnderSix;
  if (!input.arrival || !input.departure || nights <= 0) return "Choose valid arrival and departure dates.";
  if (guests < 1) return "Add at least one guest.";
  if (guests > 8) return "Coco Palms accommodates up to 8 guests, including children under 6.";
  if (overlapsFestive(input.arrival, input.departure) && nights < 10) return "A minimum stay of 10 nights applies over the festive period.";
  if (nights < 4) return "Minimum stay is 5 nights. Four night stays are available with an additional $500 short-stay levy.";
  return null;
}

export function calculateQuote(input: QuoteInput): QuoteCalculation {
  const validationError = validateQuoteRequest(input);
  if (validationError) throw new Error(validationError);

  const nights = nightsBetween(input.arrival, input.departure);
  const start = parseDate(input.arrival);
  const pricedNights = Array.from({ length: nights }, (_, index) => ratePeriod(new Date(start.getTime() + index * DAY_MS)));
  const accommodation = pricedNights.reduce((sum, night) => sum + night.rate, 0);
  const rateBreakdown = Array.from(pricedNights.reduce((groups, night) => {
    const current = groups.get(night.period) ?? { period: night.period, nights: 0, rate: night.rate, total: 0 };
    current.nights += 1;
    current.total += night.rate;
    groups.set(night.period, current);
    return groups;
  }, new Map<string, { period: string; nights: number; rate: number; total: number }>()).values());
  const averageRate = accommodation / nights;
  const longStayDiscount = nights > 14 ? -((nights - 14) * averageRate * 0.2) : 0;
  const selected = new Set(input.secondaryDiscounts ?? []);
  const secondaryDiscountType = SECONDARY_PRIORITY.find((discount) => selected.has(discount)) ?? null;
  const afterLongStay = accommodation + longStayDiscount;
  const secondaryDiscount = secondaryDiscountType ? -(afterLongStay * DISCOUNT_RATE[secondaryDiscountType]) : 0;
  const discountedAccommodation = afterLongStay + secondaryDiscount;
  const shortStayLevy = nights === 4 ? 500 : 0;
  const abst = (discountedAccommodation + shortStayLevy) * 0.17;
  const guests = input.adults + input.childrenSixToSeventeen + input.childrenUnderSix;
  const levyGuests = input.adults + input.childrenSixToSeventeen;
  const governmentLevy = levyGuests * 5 * nights;
  const securityDeposit = 2000;
  const fees = (discountedAccommodation + shortStayLevy + abst + governmentLevy + securityDeposit) * 0.05;
  const quotationTotal = discountedAccommodation + shortStayLevy + abst + governmentLevy + fees;
  return {
    nights,
    guests,
    levyGuests,
    accommodation,
    rateBreakdown,
    longStayDiscount,
    secondaryDiscount,
    secondaryDiscountType,
    discountedAccommodation,
    shortStayLevy,
    abst,
    governmentLevy,
    fees,
    quotationTotal,
    securityDeposit,
    dueToConfirm: quotationTotal * 0.5,
    balanceDue: quotationTotal * 0.5,
    balanceDueDaysBeforeArrival: 70,
  };
}
