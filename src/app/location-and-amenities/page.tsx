import Image from "next/image";
import Link from "next/link";
import {
  Anchor,
  BedDouble,
  CarFront,
  Coffee,
  ConciergeBell,
  CookingPot,
  Droplets,
  Fan,
  Sailboat,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";

export const metadata = { title: "Location & Amenities" };

const amenities = [
  [Waves, "Waterfront setting"],
  [BedDouble, "Four bedrooms"],
  [CookingPot, "Full kitchen"],
  [Droplets, "Private swimming pool"],
  [Anchor, "Private boat dock"],
  [CookingPot, "Outdoor kitchen"],
  [ShowerHead, "Outdoor shower"],
  [Sailboat, "Kayaks and stand-up paddle boards"],
  [Coffee, "Coffee machine"],
  [Wifi, "Broadband with guest wifi"],
  [UtensilsCrossed, "Indoor and al fresco dining"],
  [Tv, "Smart TVs, cable and Apple TV"],
  [Fan, "AC and ceiling fans in all rooms"],
  [Sparkles, "Dishwasher"],
  [WashingMachine, "Laundry room with Washer & Dryer"],
  [CarFront, "Ample off-road parking"],
  [ShieldCheck, "Gated community with 24/7 security"],
  [ConciergeBell, "On-island concierge services"],
] as const;

export default function LocationPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Jolly Harbour, Antigua</span>
        <h1>Everything close, the water closer</h1>
        <p>
          Coco Palms sits on Harbour Island on Antigua’s west coast, within the gated Jolly Harbour
          community.
        </p>
      </section>
      <section className="section location-copy">
        <div>
          <h2>A relaxed base for discovering Antigua</h2>
          <p>
            Spend slow mornings beside your private pool, set out by boat from the dock, or explore
            the beaches, restaurants, shops and activities around Jolly Harbour. Antigua’s coves,
            sailing and historic harbours are within easy reach.
          </p>
          <a
            className="text-link"
            href="https://goo.gl/maps/JfrmfU2js8Hwmnqq8"
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
          <Image
            className="location-collage"
            src="/images/coco-palms-location-collage.jpg"
            alt="Coco Palms villa, pool, private dock and waterfront views"
            width={960}
            height={960}
            sizes="(max-width: 900px) calc(100vw - 2.4rem), 32vw"
          />
        </div>
        <div className="amenities-grid">
          {amenities.map(([Icon, label]) => (
            <div className="amenity" key={label}>
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="quote-invitation section">
        <div>
          <span className="eyebrow light">Your dates, your party</span>
          <h2>Build your personalised quotation</h2>
        </div>
        <Link className="button button-gold" href="/get-quotation">
          Get Quotation
        </Link>
      </section>
    </>
  );
}
