import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

describe("site theme", () => {
  it("uses the selected Caribbean teal instead of the bright blue accent", () => {
    expect(css).toContain("--teal:#087f7a");
    expect(css).toContain(".contact-details,.rates-card,.quote-invitation{background:#087f7a}");
  });

  it("rounds quotation links and native buttons consistently", () => {
    expect(css).toMatch(/\.button\{[^}]*border-radius:8px/);
    expect(css).toContain("button{border-radius:8px}");
  });
});
