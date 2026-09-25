"use client";

import { trackEvent } from "@/lib/analytics";

import { format, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { QuoteConfirmationDetails } from "./types";

type Status = "idle" | "confirming" | "sending" | "sent" | "recorded-email-failed" | "error";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const recordedEmailFailure = "Your request was recorded, but the notification could not be sent. Please try again.";

export function BookNowButton({
  token,
  details,
  disabled = false,
}: {
  token?: string;
  details?: QuoteConfirmationDetails;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const bookNowRef = useRef<HTMLButtonElement>(null);
  const completionRef = useRef<HTMLParagraphElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sendingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const dialogOpen = status === "confirming" || status === "sending" || status === "recorded-email-failed" || status === "error";

  function close() {
    if (sendingRef.current) return;
    restoreFocusRef.current = true;
    setStatus("idle");
  }

  useEffect(() => {
    if (dialogOpen) titleRef.current?.focus();
  }, [dialogOpen]);

  useEffect(() => {
    if (status === "idle" && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      bookNowRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    if (!dialogOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])",
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === titleRef.current || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen || !backdropRef.current) return;
    const backdrop = backdropRef.current;
    const background = Array.from(document.body.children).filter((element) => element !== backdrop);
    const previous = background.map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    for (const element of background) {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }

    return () => {
      for (const { element, inert, ariaHidden } of previous) {
        if (!inert) element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (status === "sent") completionRef.current?.focus();
  }, [status]);

  async function send() {
    if (!token || sendingRef.current || status === "sent") return;
    sendingRef.current = true;
    setStatus("sending");
    try {
      const response = await fetch(`/api/quotes/${token}/book-now`, { method: "POST" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { recorded?: boolean } | null;
        setStatus(response.status === 503 && result?.recorded === true ? "recorded-email-failed" : "error");
        return;
      }
      trackEvent("booking_request", {
        currency: "USD",
        value: details?.quotationTotal ?? 0,
        nights: details?.nights ?? 0,
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      sendingRef.current = false;
    }
  }

  const confirmationDialog = dialogOpen && details ? createPortal(<div ref={backdropRef} className="booking-confirmation-backdrop" role="presentation">
    <section
      ref={dialogRef}
      className="booking-confirmation-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-confirmation-title"
    >
      <h2 id="booking-confirmation-title" ref={titleRef} tabIndex={-1}>Confirm your booking request</h2>
      <dl className="booking-confirmation-summary">
        <dt>Arrival</dt><dd>{format(parseISO(details.arrival), "d MMMM yyyy")}</dd>
        <dt>Departure</dt><dd>{format(parseISO(details.departure), "d MMMM yyyy")}</dd>
        <dt>Nights</dt><dd>{details.nights}</dd>
        <dt>Adults</dt><dd>{details.adults}</dd>
        <dt>Children aged 6 or over</dt><dd>{details.childrenSixToSeventeen}</dd>
        <dt>Children under 6</dt><dd>{details.childrenUnderSix}</dd>
        <dt>Quotation total</dt><dd>{money.format(details.quotationTotal)}</dd>
        <dt>Due on booking</dt><dd>{money.format(details.dueToConfirm)}</dd>
        <dt>Separate refundable security deposit</dt><dd>{money.format(details.securityDeposit)}</dd>
      </dl>
      <p className="booking-confirmation-warning">
        This is a request to proceed with the booking. Your dates are not secured until Coco Palms confirms the booking and the required deposit has been paid.
      </p>
      {status === "recorded-email-failed" && <p className="form-error" role="alert">{recordedEmailFailure}</p>}
      {status === "error" && <p className="form-error" role="alert">Your request could not be sent. Please try again.</p>}
      <div className="booking-confirmation-actions">
        <button type="button" className="button booking-confirmation-back" disabled={status === "sending"} onClick={close}>Go back</button>
        <button type="button" className="button" disabled={status === "sending"} onClick={send}>
          {status === "sending" ? "Sending…" : status === "recorded-email-failed" ? "Retry notification" : "Confirm booking request"}
        </button>
      </div>
    </section>
  </div>, document.body) : null;

  return <div className="book-now-action">
    <button
      ref={bookNowRef}
      type="button"
      className="button quote-submit"
      disabled={!token || !details || disabled || status !== "idle"}
      onClick={() => setStatus("confirming")}
    >
      {disabled ? "Quotation expired" : status === "sent" ? "Request sent" : "Book Now"}
    </button>
    {disabled && <p className="form-note booking-expired-note">
      This quotation has expired. A new quotation is required before you can proceed. <a className="text-link" href="/rates-and-availability">Get a new quotation</a>
    </p>}
    {status === "sent" && <p ref={completionRef} className="form-note" role="status" tabIndex={-1}>Thank you. Coco Palms has received your request. Your dates are not secured until your booking is confirmed and the required deposit has been paid.</p>}
    {confirmationDialog}
  </div>;
}
