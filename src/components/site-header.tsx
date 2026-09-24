"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["The Villa", "/the-villa"],
  ["Location & Amenities", "/location-and-amenities"],
  ["Gallery", "/gallery"],
  ["Rates & Availability", "/rates-and-availability"],
  ["Contact", "/contact"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header" style={{ position: "sticky", top: 0 }}>
      <Link className="brand" href="/" aria-label="Coco Palms home">
        <Image className="brand-logo" src="/images/cocopalms-logo.jpg" alt="Coco Palms Antigua West Indies" width={193} height={96} priority />
      </Link>
      <button className="menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link className="button button-small" href="/rates-and-availability" onClick={() => setOpen(false)}>Get Quotation</Link>
      </nav>
    </header>
  );
}
