import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicQuote } from "@/features/quotes/public-quote";
import { sendEmail } from "@/lib/email/resend";
import { createBookNowPostHandler, POST } from "./route";

const database = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { rpc: vi.fn(), from, select, eq, maybeSingle };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => database,
}));
vi.mock("@/lib/email/resend", () => ({ sendEmail: vi.fn() }));

const quote = {
  token: "token",
  reference: "TOKEN",
  name: "Paul",
  email: "paul@example.com",
  arrival: "2027-06-01",
  departure: "2027-06-08",
  adults: 2,
  childrenSixToSeventeen: 0,
  childrenUnderSix: 0,
  createdAt: "2026-09-17T12:00:00Z",
  expiresAt: "2026-09-20T12:00:00Z",
  calculation: {
    nights: 7,
    guests: 2,
    levyGuests: 2,
    accommodation: 7000,
    rateBreakdown: [],
    longStayDiscount: 0,
    secondaryDiscount: 0,
    secondaryDiscountType: null,
    discountedAccommodation: 7000,
    shortStayLevy: 0,
    abst: 1190,
    governmentLevy: 70,
    fees: 513,
    quotationTotal: 8773,
    securityDeposit: 2000,
    dueToConfirm: 4386.5,
    balanceDue: 4386.5,
    balanceDueDaysBeforeArrival: 70,
  },
} satisfies PublicQuote;

const requestedAt = "2026-09-18T12:00:00.000Z";

function createDependencies() {
  return {
    acceptQuote: vi.fn().mockResolvedValue({
      outcome: "accepted" as const,
      quoteId: "quote-id",
      requestedAt,
      notificationSent: false,
    }),
    getQuote: vi.fn().mockResolvedValue(quote),
    sendNotification: vi.fn().mockResolvedValue(undefined),
    markNotificationSent: vi.fn().mockResolvedValue(undefined),
  };
}

async function post(handler: ReturnType<typeof createBookNowPostHandler>) {
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({ token: "token" }),
  });
}

describe("POST /api/quotes/[token]/book-now", () => {
  it("returns a generic retryable response when acceptance rejects without claiming it was recorded", async () => {
    const dependencies = createDependencies();
    dependencies.acceptQuote.mockRejectedValue(new Error("private transport error"));

    const response = await post(createBookNowPostHandler(dependencies));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Your request could not be sent. Please try again.",
    });
    expect(dependencies.getQuote).not.toHaveBeenCalled();
    expect(dependencies.sendNotification).not.toHaveBeenCalled();
    expect(dependencies.markNotificationSent).not.toHaveBeenCalled();
  });

  it("returns 404 when the quotation does not exist", async () => {
    const dependencies = createDependencies();
    dependencies.acceptQuote.mockResolvedValue({ outcome: "not_found" });
    const missingResponse = await post(createBookNowPostHandler(dependencies));

    expect((await missingResponse.json()).error).toBe("Quotation not found.");
    expect(missingResponse.status).toBe(404);
  });

  it("returns 410 when the quotation has expired", async () => {
    const dependencies = createDependencies();
    dependencies.acceptQuote.mockResolvedValue({ outcome: "expired" });
    const expiredResponse = await post(createBookNowPostHandler(dependencies));

    expect((await expiredResponse.json()).error).toBe(
      "This quotation has expired. Please request a new quotation.",
    );
    expect(expiredResponse.status).toBe(410);
  });

  it("sends and records the owner notification after accepting the quote", async () => {
    const dependencies = createDependencies();
    const response = await post(createBookNowPostHandler(dependencies));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, alreadySent: false });
    expect(dependencies.acceptQuote).toHaveBeenCalledWith("token");
    expect(dependencies.getQuote).toHaveBeenCalledWith("quote-id");
    expect(dependencies.sendNotification).toHaveBeenCalledWith(
      quote,
      requestedAt,
      "coco-palms-booking-request-quote-id",
    );
    expect(dependencies.markNotificationSent).toHaveBeenCalledWith("quote-id");
    expect(dependencies.acceptQuote.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.sendNotification.mock.invocationCallOrder[0],
    );
  });

  it("does not send the notification again when it was already sent", async () => {
    const dependencies = createDependencies();
    dependencies.acceptQuote.mockResolvedValue({
      outcome: "accepted",
      quoteId: "quote-id",
      requestedAt,
      notificationSent: true,
    });
    const response = await post(createBookNowPostHandler(dependencies));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, alreadySent: true });
    expect(dependencies.sendNotification).not.toHaveBeenCalled();
  });

  it("returns 404 when the accepted quotation cannot be loaded", async () => {
    const dependencies = createDependencies();
    dependencies.getQuote.mockResolvedValue(null);
    const response = await post(createBookNowPostHandler(dependencies));

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Quotation not found.");
    expect(dependencies.sendNotification).not.toHaveBeenCalled();
  });

  it("reports a recoverable failure when the recorded quote cannot be reloaded", async () => {
    const dependencies = createDependencies();
    dependencies.getQuote.mockRejectedValue(new Error("database unavailable"));
    const failedResponse = await post(createBookNowPostHandler(dependencies));

    expect(failedResponse.status).toBe(503);
    expect(await failedResponse.json()).toEqual({
      error:
        "Your request was recorded, but the notification could not be sent. Please try again.",
      recorded: true,
    });
    expect(dependencies.sendNotification).not.toHaveBeenCalled();
    expect(dependencies.markNotificationSent).not.toHaveBeenCalled();
  });

  it("reports a recoverable failure when the recorded request cannot be notified", async () => {
    const dependencies = createDependencies();
    dependencies.sendNotification.mockRejectedValue(new Error("email unavailable"));
    const failedResponse = await post(createBookNowPostHandler(dependencies));

    expect(failedResponse.status).toBe(503);
    expect(await failedResponse.json()).toEqual({
      error:
        "Your request was recorded, but the notification could not be sent. Please try again.",
      recorded: true,
    });
    expect(dependencies.markNotificationSent).not.toHaveBeenCalled();
  });
});

describe("production booking-request adapters", () => {
  const acceptance = {
    outcome: "accepted",
    quote_id: "database-quote-id",
    requested_at: requestedAt,
    notification_sent: false,
  };
  const databaseQuote = {
    public_token: "database-token",
    contact_name: "Database Guest",
    contact_email: "database-guest@example.com",
    start_date: "2027-06-01",
    end_date: "2027-06-08",
    adults_count: 2,
    children_6_17_count: 1,
    under6_count: 1,
    created_at: "2026-09-17T12:00:00Z",
    expires_at: "2026-09-20T12:00:00Z",
    breakdown: {
      nights: 7,
      party_size: 4,
      levy_guests: 3,
      base_total: 7000,
      rate_breakdown: [{ period: "Summer", nights: 7, rate: 1000, total: 7000 }],
      discounted_base: 7000,
      abst_total: 1190,
      levy_total: 105,
      fees_total: 514.75,
      quotation_total: 8809.75,
      security_deposit: 2000,
      deposit_due: 4404.875,
      balance_due: 4404.875,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    database.rpc.mockReset();
    database.maybeSingle.mockReset().mockResolvedValue({ data: databaseQuote, error: null });
    vi.mocked(sendEmail).mockReset().mockResolvedValue(undefined);
  });

  it("maps acceptance and reloads authoritative database fields before sending and marking", async () => {
    database.rpc
      .mockResolvedValueOnce({ data: acceptance, error: null })
      .mockResolvedValueOnce({ data: requestedAt, error: null });

    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ contact_name: "Untrusted Guest", quotation_total: 1 }),
    }), { params: Promise.resolve({ token: "token" }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, alreadySent: false });
    expect(database.rpc).toHaveBeenNthCalledWith(1, "accept_website_quote", { p_token: "token" });
    expect(database.from).toHaveBeenCalledExactlyOnceWith("quotes");
    expect(database.select).toHaveBeenCalledExactlyOnceWith(
      "public_token,contact_name,contact_email,start_date,end_date,adults_count,children_6_17_count,under6_count,created_at,expires_at,breakdown",
    );
    expect(database.eq).toHaveBeenCalledExactlyOnceWith("id", "database-quote-id");
    expect(database.maybeSingle).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      to: "hello@cocopalms-antigua.com",
      replyTo: "database-guest@example.com",
      subject: "Book Now enquiry DATABASE from Database Guest",
    }), { idempotencyKey: "coco-palms-booking-request-database-quote-id" });
    const message = vi.mocked(sendEmail).mock.calls[0][0];
    for (const line of [
      "Requested: 18 September 2026 at 12:00 UTC",
      "Stay: 1 June 2027 to 8 June 2027",
      "Nights: 7", "Adults: 2", "Children aged 6–17: 1", "Children under 6: 1",
      "Summer: 7 nights at $1,000.00 = $7,000.00",
      "Quotation total: $8,809.75", "Due to confirm: $4,404.88",
      "Balance: $4,404.88", "Separate refundable security deposit: $2,000.00",
    ]) expect(message.text).toContain(line);
    expect(message.text).not.toContain("Untrusted Guest");
    expect(database.rpc).toHaveBeenNthCalledWith(2, "mark_website_booking_request_notified", {
      p_quote_id: "database-quote-id",
    });
    expect(database.rpc.mock.invocationCallOrder[0]).toBeLessThan(database.from.mock.invocationCallOrder[0]);
    expect(database.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(sendEmail).mock.invocationCallOrder[0]);
    expect(vi.mocked(sendEmail).mock.invocationCallOrder[0]).toBeLessThan(database.rpc.mock.invocationCallOrder[1]);
  });

  it.each([
    ["not_found", 404],
    ["expired", 410],
  ])("maps the %s RPC outcome without querying or sending", async (outcome, status) => {
    database.rpc.mockResolvedValue({ data: { outcome }, error: null });

    const response = await post(POST);

    expect(response.status).toBe(status);
    expect(await response.json()).not.toHaveProperty("recorded");
    expect(database.from).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(database.rpc).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["null payload", null],
    ["unknown outcome", { outcome: "unexpected" }],
    ["missing quote identifier", { ...acceptance, quote_id: undefined }],
    ["missing request timestamp", { ...acceptance, requested_at: undefined }],
    ["non-boolean notification flag", { ...acceptance, notification_sent: "false" }],
  ])("returns generic retryable JSON for %s without claiming acceptance", async (_label, data) => {
    database.rpc.mockResolvedValue({ data, error: null });

    const response = await post(POST);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Your request could not be sent. Please try again." });
    expect(database.from).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(database.rpc).toHaveBeenCalledTimes(1);
  });

  it.each(["rejection", "RPC error"])("handles acceptance %s without leaking transport details", async (failure) => {
    const error = new Error("private database transport detail");
    if (failure === "rejection") database.rpc.mockRejectedValue(error);
    else database.rpc.mockResolvedValue({ data: null, error });

    const response = await post(POST);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Your request could not be sent. Please try again." });
    expect(database.from).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(database.rpc).toHaveBeenCalledTimes(1);
  });

  it("retries a successful send after marker failure with identical email/idempotency, then skips notified requests", async () => {
    database.rpc
      .mockResolvedValueOnce({ data: acceptance, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("marker unavailable") })
      .mockResolvedValueOnce({ data: acceptance, error: null })
      .mockResolvedValueOnce({ data: requestedAt, error: null })
      .mockResolvedValueOnce({ data: { ...acceptance, notification_sent: true }, error: null });

    const failedResponse = await post(POST);
    expect(failedResponse.status).toBe(503);
    expect(await failedResponse.json()).toEqual({
      error: "Your request was recorded, but the notification could not be sent. Please try again.",
      recorded: true,
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const retryResponse = await post(POST);
    expect(retryResponse.status).toBe(200);
    expect(await retryResponse.json()).toEqual({ ok: true, alreadySent: false });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendEmail).mock.calls[1]).toEqual(vi.mocked(sendEmail).mock.calls[0]);
    expect(vi.mocked(sendEmail).mock.calls[1][1]).toEqual({
      idempotencyKey: "coco-palms-booking-request-database-quote-id",
    });

    const repeatResponse = await post(POST);
    expect(repeatResponse.status).toBe(200);
    expect(await repeatResponse.json()).toEqual({ ok: true, alreadySent: true });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(database.from).toHaveBeenCalledTimes(2);
    expect(database.rpc.mock.calls).toEqual([
      ["accept_website_quote", { p_token: "token" }],
      ["mark_website_booking_request_notified", { p_quote_id: "database-quote-id" }],
      ["accept_website_quote", { p_token: "token" }],
      ["mark_website_booking_request_notified", { p_quote_id: "database-quote-id" }],
      ["accept_website_quote", { p_token: "token" }],
    ]);
  });
});
