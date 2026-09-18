import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), sendEmail: vi.fn() }));

vi.mock("@/lib/supabase/public", () => ({
  createPublicSupabaseClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/email/resend", () => ({ sendEmail: mocks.sendEmail }));

import { POST } from "./route";

describe("POST /api/contact", () => {
  beforeEach(() => {
    mocks.rpc.mockReset().mockResolvedValue({ error: null });
    mocks.sendEmail.mockReset().mockResolvedValue(undefined);
  });

  it("stores the enquiry and sends it to Coco Palms through Resend", async () => {
    const response = await POST(new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alex Guest", email: "alex@example.com", message: "Are these dates available?" }),
    }) as never);

    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("create_contact_enquiry", expect.objectContaining({ p_email: "alex@example.com" }));
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "hello@cocopalms-antigua.com",
      subject: "Coco Palms Enquiry",
      replyTo: "alex@example.com",
    }));
  });

  it("still sends the enquiry when contact storage is unavailable", async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { message: "database unavailable" } });

    const response = await POST(new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alex Guest", email: "alex@example.com", message: "Are these dates available?" }),
    }) as never);

    expect(response.status).toBe(201);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "hello@cocopalms-antigua.com",
      replyTo: "alex@example.com",
    }));
  });
});
