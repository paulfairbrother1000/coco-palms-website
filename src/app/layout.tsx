import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const googleAnalyticsId = "G-MN0HKR5NYZ";

export const metadata: Metadata = {
  title: { default: "Coco Palms Antigua | Waterfront Villa", template: "%s | Coco Palms Antigua" },
  description: "A contemporary 4-bedroom waterfront villa with a private pool in Jolly Harbour, Antigua.",
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
