export const PUBLISHED_RATE_BANDS = {
  summer: { calculationPeriod: "15th May to 15th Nov", displayPeriod: "15 May – 15 November", nightlyRate: 1200 },
  preFestive: { calculationPeriod: "16th Nov to 17th Dec", displayPeriod: "16 November – 17 December", nightlyRate: 1250 },
  festive: { calculationPeriod: "18th Dec to 3rd Jan", displayPeriod: "18 December – 3 January", nightlyRate: 1500 },
  winterSpring: { calculationPeriod: "4th Jan to 14th May", displayPeriod: "4 January – 14 May", nightlyRate: 1250 },
} as const;

export const PUBLISHED_RATES = [
  PUBLISHED_RATE_BANDS.summer,
  PUBLISHED_RATE_BANDS.preFestive,
  PUBLISHED_RATE_BANDS.festive,
  PUBLISHED_RATE_BANDS.winterSpring,
] as const;
