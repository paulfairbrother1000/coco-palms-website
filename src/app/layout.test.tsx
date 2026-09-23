import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "font-sans" }),
}));
import RootLayout from "./layout";

describe("root layout analytics", () => {
  it("loads the linked GA4 property and configures page-level reporting", () => {
    render(<RootLayout><div>Page content</div></RootLayout>);

    expect(document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-MN0HKR5NYZ"]')).toBeInTheDocument();
    expect(document.querySelector("script#google-analytics-config")).toHaveTextContent(
      "gtag('config', 'G-MN0HKR5NYZ')",
    );
  });
});
