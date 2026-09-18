import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./contact-form";

describe("contact form", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a useful failure message when the contact request cannot reach the server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Alex Guest");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Message"), "Are these dates available?");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your message could not be sent. Please email hello@cocopalms-antigua.com.");
  });
});
