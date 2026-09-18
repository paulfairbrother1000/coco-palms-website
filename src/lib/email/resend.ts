import { Resend } from "resend";

export type EmailMessage = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email service is not configured.");
  const from = process.env.QUOTATION_FROM_EMAIL ?? "Coco Palms <hello@cocopalms-antigua.com>";
  const { error } = await new Resend(apiKey).emails.send({ from, to: message.to, subject: message.subject, html: message.html, text: message.text, replyTo: message.replyTo });
  if (error) throw new Error("Email could not be sent.");
}
