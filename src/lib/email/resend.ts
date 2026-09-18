import { Resend } from "resend";

export type EmailMessage = { to: string; cc?: string; subject: string; html: string; text: string; replyTo?: string };
type SendEmailOptions = { idempotencyKey?: string };

export async function sendEmail(message: EmailMessage, options: SendEmailOptions = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email service is not configured.");
  const from = process.env.QUOTATION_FROM_EMAIL ?? "Coco Palms <hello@cocopalms-antigua.com>";
  const { error } = await new Resend(apiKey).emails.send(
    { from, to: message.to, cc: message.cc, subject: message.subject, html: message.html, text: message.text, replyTo: message.replyTo },
    options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
  );
  if (error) throw new Error("Email could not be sent.");
}
