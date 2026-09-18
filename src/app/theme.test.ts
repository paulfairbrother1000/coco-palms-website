import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

describe("site theme", () => {
  it("uses the selected pool aqua blue across the accent theme", () => {
    expect(css).toContain("--teal:#087fa8");
    expect(css).toContain(".contact-details,.rates-card,.quote-invitation{background:#087fa8}");
  });

  it("matches the desktop published-rates width to the calendar column", () => {
    expect(css).toContain(".quotation-overview{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr)");
    expect(css).toContain(".quotation-overview .quotation-intro{grid-column:1");
  });

  it("rounds quotation links and native buttons consistently", () => {
    expect(css).toMatch(/\.button\{[^}]*border-radius:8px/);
    expect(css).toContain("button{border-radius:8px}");
  });
});
