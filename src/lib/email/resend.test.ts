import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

import { sendEmail } from "./resend";

describe("sendEmail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
    mocks.send.mockReset().mockResolvedValue({ error: null });
  });

  it("passes the CC recipient to Resend", async () => {
    await sendEmail({
      to: "paul@example.com",
      cc: "hello@cocopalms-antigua.com",
      subject: "Coco Palms Quotation for Paul Fairbrother",
      text: "Quotation",
      html: "<p>Quotation</p>",
    });

    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      to: "paul@example.com",
      cc: "hello@cocopalms-antigua.com",
    }), undefined);
  });

  it("passes an idempotency key to Resend", async () => {
    await sendEmail(
      { to: "hello@cocopalms-antigua.com", subject: "Booking request", text: "Text", html: "<p>Text</p>" },
      { idempotencyKey: "booking-request-quote-id" },
    );

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "hello@cocopalms-antigua.com" }),
      { idempotencyKey: "booking-request-quote-id" },
    );
  });
});
