export const QUOTE_VALIDITY_DAYS = 10;

export const QUOTE_VALIDITY_MESSAGE =
  "This quotation is based on the rates, taxes and fees in effect when it was issued and is valid for 10 days. After that, prices may change and a new quotation may be required.";

export function quoteExpiryDate(issuedAt: Date) {
  return new Date(issuedAt.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}
