"use client";

import { format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";
import { QuotationCalendar } from "@/features/availability/quotation-calendar";
import type { UnavailableRange } from "@/features/availability/date-range";
import { trackEvent } from "@/lib/analytics";
import type { QuoteCalculation, QuoteConfirmationDetails } from "./types";
import { QuoteResult } from "./quote-result";

type QuoteResponse = {
  calculation: QuoteCalculation;
  publicToken?: string;
  emailSent?: boolean;
  confirmation?: QuoteConfirmationDetails;
};

type PartyNumberInputProps = {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

function PartyNumberInput({ label, name, min, max, defaultValue }: PartyNumberInputProps) {
  const id = useId();
  const [value, setValue] = useState(String(defaultValue));

  function adjust(delta: number) {
    const parsed = Number(value);
    const current = value === "" || !Number.isFinite(parsed) ? min : parsed;
    setValue(String(Math.min(max, Math.max(min, current + delta))));
  }

  return <div className="party-number-field">
    <label htmlFor={id}>{label}</label>
    <div className="party-number-control">
      <button className="party-step-button" type="button" aria-label={`Decrease ${label}`} onClick={() => adjust(-1)}>−</button>
      <input id={id} required name={name} type="number" min={min} max={max} value={value} onChange={(event) => setValue(event.target.value)} />
      <button className="party-step-button" type="button" aria-label={`Increase ${label}`} onClick={() => adjust(1)}>+</button>
    </div>
  </div>;
}

export function QuoteForm() {
  const params = useSearchParams();
  const [arrival, setArrival] = useState(params.get("arrival") ?? "");
  const [departure, setDeparture] = useState(params.get("departure") ?? "");
  const [ranges, setRanges] = useState<UnavailableRange[]>([]);
  const [calendarError, setCalendarError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/availability").then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Availability could not be loaded.");
      if (active) setRanges(result.ranges ?? []);
    }).catch(() => { if (active) setCalendarError("Availability could not be loaded. Please refresh and try again."); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setQuote(null);
    if (!arrival || !departure) {
      setError("Select your arrival and departure dates from the calendar.");
      return;
    }
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), email: form.get("email"), arrival, departure, adults: Number(form.get("adults")), childrenSixToSeventeen: Number(form.get("childrenSixToSeventeen")), childrenUnderSix: Number(form.get("childrenUnderSix")) };
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as QuoteResponse & { error?: string };
      if (!response.ok) { setError(result.error ?? "We could not prepare your quotation."); return; }
      trackEvent("generate_lead", {
        method: "quotation",
        currency: "USD",
        value: result.calculation.quotationTotal,
        nights: result.calculation.nights,
        guests: result.calculation.guests,
      });
      setQuote({
        ...result,
        confirmation: {
          arrival,
          departure,
          adults: payload.adults,
          childrenSixToSeventeen: payload.childrenSixToSeventeen,
          childrenUnderSix: payload.childrenUnderSix,
          nights: result.calculation.nights,
          quotationTotal: result.calculation.quotationTotal,
          dueToConfirm: result.calculation.dueToConfirm,
          securityDeposit: result.calculation.securityDeposit,
        },
      });
    } catch {
      setError("We could not prepare your quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="quote-journey">
    <form className="quote-form" onSubmit={submit}>
      <fieldset>
        <legend>Choose your stay</legend>
        {calendarError ? <p className="form-error" role="alert">{calendarError}</p> : <QuotationCalendar ranges={ranges} arrival={arrival} departure={departure} onChange={(nextArrival, nextDeparture) => { setArrival(nextArrival); setDeparture(nextDeparture); setQuote(null); }} />}
        <div className="selected-stay" role="status" aria-live="polite"><span className="eyebrow">Selected stay</span><strong>{arrival ? format(parseISO(arrival), "d MMMM yyyy") : "Choose arrival"} — {departure ? format(parseISO(departure), "d MMMM yyyy") : "choose departure"}</strong></div>
      </fieldset>
      <fieldset><legend>Your party</legend><p className="form-note">All children count towards the maximum occupancy of 8. Children under 6 are not charged the government levy.</p><div className="form-grid three"><PartyNumberInput label="Adults" name="adults" min={1} max={8} defaultValue={2} /><PartyNumberInput label="Children aged 6 or over" name="childrenSixToSeventeen" min={0} max={8} defaultValue={0} /><PartyNumberInput label="Children under 6" name="childrenUnderSix" min={0} max={8} defaultValue={0} /></div></fieldset>
      <fieldset><legend>Your details</legend><div className="form-grid"><label>Name<input required name="name" autoComplete="name" /></label><label>Email<input required name="email" type="email" autoComplete="email" /></label></div></fieldset>
      <label className="consent"><input required type="checkbox" /> I agree that Coco Palms may use these details to prepare and email my quotation.</label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button quote-submit" disabled={loading || Boolean(calendarError)}>{loading ? "Preparing quotation…" : "Get Quotation"}</button>
    </form>
    {quote && <QuoteResult calculation={quote.calculation} publicToken={quote.publicToken} emailSent={quote.emailSent} confirmation={quote.confirmation} />}
  </div>;
}
