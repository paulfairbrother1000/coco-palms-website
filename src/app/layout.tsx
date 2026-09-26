import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const googleAnalyticsId = "G-MN0HKR5NYZ";
const siteUrl = "https://www.cocopalms-antigua.com";

const property = {
  "@context": "https://schema.org",
  "@type": "VacationRental",
  "@id": `${siteUrl}/#property`,
  identifier: "coco-palms-jolly-harbour-antigua",
  name: "Coco Palms Antigua",
  url: siteUrl,
  description: "Private waterfront villa on Harbour Island in Jolly Harbour, Antigua. Four bedrooms sleep up to eight guests, with a private pool, boat dock and on-island concierge.",
  address: { "@type": "PostalAddress", streetAddress: "Harbour Island", addressLocality: "Jolly Harbour", addressRegion: "St Mary's", addressCountry: "AG" },
  latitude: 17.0758196,
  longitude: -61.885398,
  containsPlace: {
    "@type": "Accommodation",
    additionalType: "EntirePlace",
    numberOfBedrooms: 4,
    numberOfBathroomsTotal: 3,
    occupancy: { "@type": "QuantitativeValue", value: 8 },
    amenityFeature: ["Private swimming pool", "Private boat dock", "Outdoor kitchen", "Kayaks and stand-up paddle boards", "On-island concierge services"].map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
  },
  image: ["/images/coco-palms-home-page.jpeg", "/images/villa/great-room.jpg", "/images/villa/bedroom.jpg", "/images/villa/dining-area.jpg", "/images/gallery/interior/image12.jpg", "/images/villa/pool-and-dock-aerial.jpg", "/images/location/kayaks-and-paddleboards.jpg", "/images/location/coco-palms-pool-sunset.jpg"].map((path) => `${siteUrl}${path}`),
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Coco Palms Antigua | Waterfront Villa", template: "%s | Coco Palms Antigua" },
  description: "Stay at Coco Palms, a private 4-bedroom waterfront villa in Jolly Harbour, Antigua. Sleeps 8, with a private pool and boat dock. Check rates and availability.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: "Coco Palms Antigua | Waterfront Villa", images: ["/images/coco-palms-home-page.jpeg"] },
  icons: {
    icon: [{ url: "/images/cocopalms-logo.jpg", type: "image/jpeg" }],
    shortcut: "/images/cocopalms-logo.jpg",
    apple: "/images/cocopalms-logo.jpg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={sans.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(property).replace(/</g, "\\u003c") }} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
      </body>
    </html>
  );
}
