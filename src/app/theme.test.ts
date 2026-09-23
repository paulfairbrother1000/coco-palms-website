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

  it("keeps the transition from internal page headers to content compact", () => {
    expect(css).toContain("@media(min-width:901px){h1{font-size:clamp(4rem,8vw,7.25rem)}h2{font-size:clamp(2.4rem,4.5vw,4rem)}");
    expect(css).toContain(".page-hero{padding-top:3.5rem;padding-bottom:2.5rem}");
    expect(css).toContain(".page-hero+.section{padding-top:2.5rem}");
  });

  it("rounds quotation links and native buttons consistently", () => {
    expect(css).toMatch(/\.button\{[^}]*border-radius:8px/);
    expect(css).toContain("button{border-radius:8px}");
  });

  it("uses one compact gap between large headings and their following copy", () => {
    expect(css).toContain(":where(h1,h2)+p{margin-top:.75rem}");
    expect(css).toContain(".page-hero p{font-size:1.15rem;max-width:700px;margin-top:.75rem}");
  });

  it("sizes the homepage hero panel with its responsive heading", () => {
    expect(css).toContain(".hero-content{width:100%;max-width:none}");
    expect(css).toContain(".hero-title{font-size:clamp(2.5rem,6.5vw,7.25rem);white-space:nowrap}");
  });

  it("reserves equal desktop label height for the quotation party fields", () => {
    expect(css).toContain("@media(min-width:601px){.party-number-field>label{min-height:3rem}}");
  });

  it("renders gallery captions in plain regular-weight text", () => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    const gallery = document.createElement("div");
    gallery.className = "gallery-grid";
    const caption = document.createElement("figcaption");
    gallery.append(caption);
    document.body.append(gallery);

    const computed = getComputedStyle(caption);
    expect(computed.fontStyle).toBe("normal");
    expect(computed.fontWeight).toBe("400");

    gallery.remove();
    style.remove();
  });
});
