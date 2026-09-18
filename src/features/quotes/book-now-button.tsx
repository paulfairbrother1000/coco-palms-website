"use client";

import { useState } from "react";

export function BookNowButton({ token }: { token?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function send() {
    if (!token || status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      const response = await fetch(`/api/quotes/${token}/book-now`, { method: "POST" });
      if (!response.ok) throw new Error();
      setStatus("sent");
    } catch { setStatus("error"); }
  }
  return <div className="book-now-action">
    <button type="button" className="button quote-submit" disabled={!token || status === "sending" || status === "sent"} onClick={send}>{status === "sending" ? "Sending…" : status === "sent" ? "Enquiry sent" : "Book Now"}</button>
    {status === "sent" && <p className="form-note" role="status">Thank you. Coco Palms has received your request and will contact you.</p>}
    {status === "error" && <p className="form-error" role="alert">Your request could not be sent. Please try again.</p>}
  </div>;
}
