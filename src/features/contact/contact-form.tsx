"use client";
import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function ContactForm() {
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending…");
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (response.ok) {
        trackEvent("generate_lead", { method: "contact_form" });
        target.reset();
        setStatus("Thank you. Your message has been received.");
      } else {
        setStatus("Your message could not be sent. Please email hello@cocopalms-antigua.com.");
      }
    } catch {
      setStatus("Your message could not be sent. Please email hello@cocopalms-antigua.com.");
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <label>Name<input name="name" required /></label>
    <label>Email<input name="email" type="email" required /></label>
    <label>Message<textarea name="message" rows={6} required /></label>
    <label className="consent"><input name="wantsPromos" type="checkbox" value="true" /> Keep me informed about Coco Palms offers.</label>
    <button className="button">Send enquiry</button>
    {status && <p role="status">{status}</p>}
  </form>;
}
