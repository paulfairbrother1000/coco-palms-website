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
  ExternalLink,
  Fan,
  MapPin,
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

const locationImages = [
  {
    src: "/images/location/coco-palms-aerial.jpg",
    alt: "Aerial view of the Coco Palms pool, terrace, garden and private mooring",
    className: "location-photo location-photo-anchor",
  },
  {
    src: "/images/location/coco-palms-sunset-terrace.jpg",
    alt: "Coco Palms terrace and pool beneath a pink Antiguan sunset",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/location/coco-palms-pool-at-night.jpg",
    alt: "The illuminated Coco Palms pool and covered terrace at night",
    className: "location-photo location-photo-night",
  },
  {
    src: "/images/location/coco-palms-mooring-twilight.jpg",
    alt: "The private Coco Palms mooring looking across Jolly Harbour at twilight",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/location/coco-palms-pool-sunset.jpg",
    alt: "Coco Palms infinity pool overlooking the harbour at sunset",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/location/coco-palms-waterfront-sunset.jpg",
    alt: "Coco Palms viewed from its waterfront mooring beneath a golden sunset",
    className: "location-photo location-photo-waterfront",
  },
] as const;

const closeToHome = [
  {
    name: "Jolly Harbour village",
    distance: "Approx. 1.2 miles",
    href: "https://www.jollyharbourantigua.com/",
    copy: "The marina village brings together a supermarket, shops, cafés, bars and useful holiday services.",
  },
  {
    name: "Jolly Harbour Sports Village",
    distance: "Approx. 1.5 miles",
    href: "https://www.jollyharbourantigua.com/sports-village/",
    copy: "The Sports Village offers an athletic club, swimming pool, tennis and pickleball courts.",
  },
] as const;

const restaurants = [
  { name: "Al Porto", distance: "Approx. 1.2 miles", href: "https://al-porto.org/", copy: "Waterside Italian dining in Jolly Harbour." },
  { name: "Fat Urchin", distance: "Approx. 1.4 miles", href: "https://faturchin.com/", copy: "A relaxed public house and coastal kitchen at Jolly Harbour Marina." },
  { name: "Miracles", distance: "Approx. 1.3 miles", href: "https://www.facebook.com/MiraclesSouthCoastRestaurant/", copy: "A popular local restaurant close to the Jolly Harbour entrance." },
  { name: "Rokuni", distance: "Approx. 2.2 miles", href: "https://rokuni-antigua.com/", copy: "Asian-inspired sharing plates and cocktails at Sugar Ridge." },
  { name: "Sheer Rocks", distance: "Approx. 2.8 miles", href: "https://sheer-rocks.com/", copy: "Clifftop dining, daybeds and sunset views above Ffryes Beach." },
  { name: "Wild Tamarind", distance: "Approx. 3 miles", href: "https://www.instagram.com/wildtamarindrestaurant/", copy: "Contemporary Caribbean dining overlooking the west coast." },
  { name: "Catherine’s Café", distance: "Approx. 10.5 miles", href: "https://catherines-cafe.com/", copy: "French-inspired beachfront dining at Pigeon Point." },
  { name: "Loose Cannon", distance: "Approx. 12 miles", href: "https://www.loosecannonbeachbar.com/", copy: "A lively beach bar and restaurant on Galleon Beach." },
  { name: "Shirley Heights", distance: "Approx. 12.5 miles", href: "https://shirleyheightslookout.com/", copy: "Panoramic harbour views, barbecue and the famous Sunday gathering." },
  { name: "The Hut", distance: "Approx. 18 miles by boat", href: "https://www.instagram.com/thehutlittlejumby/", copy: "A destination beach restaurant on Little Jumby, best reached from the water." },
] as const;

const charters = [
  { name: "Barefoot Antigua", href: "https://www.barefootantigua.com/", copy: "Private powerboat charters along Antigua’s coastline." },
  { name: "Antigua Vibes", href: "https://antiguavibes.com/", copy: "Bespoke private boat tours for couples, families and groups." },
  { name: "Catch the Cat", href: "https://catchthecatantigua.com/", copy: "Private catamaran sailing, snorkelling and coastal cruises." },
] as const;

function DirectoryCard({ name, href, copy, distance }: { name: string; href: string; copy: string; distance?: string }) {
  return (
    <article className="location-directory-card">
      <div className="location-card-heading">
        <a href={href} target="_blank" rel="noreferrer">
          {name} <ExternalLink aria-hidden="true" />
        </a>
        {distance ? <span>{distance}</span> : null}
      </div>
      <p>{copy}</p>
    </article>
  );
}

export default function LocationPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Jolly Harbour, Antigua</span>
        <h1>Everything close, the water closer</h1>
        <p>
          Coco Palms is situated on Harbour Island on Antigua’s west coast, within the gated Jolly
          Harbour community.
        </p>
      </section>

      <section className="section location-introduction">
        <div className="location-intro-copy">
          <span className="eyebrow">At home on the harbour</span>
          <h2>A relaxed base for discovering Antigua</h2>
          <p>
            Spend slow mornings beside your private pool, leave by boat from the dock, or explore
            the beaches, restaurants, shops and activities around Jolly Harbour. Antigua’s coves,
            sailing and historic harbours are within easy reach.
          </p>
          <a className="text-link" href="https://goo.gl/maps/JfrmfU2js8Hwmnqq8" target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" /> Open Coco Palms in Google Maps
          </a>
        </div>
        <div className="location-mosaic" aria-label="Coco Palms waterfront views">
          {locationImages.map((image) => (
            <figure className={image.className} key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
                data-testid="location-mosaic-image"
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="section local-guide-section">
        <div className="section-heading">
          <span className="eyebrow">Jolly Harbour on your doorstep</span>
          <h2>Everyday essentials and time to play</h2>
          <p>
            Jolly Harbour’s marina village, sports facilities and waterfront restaurants make it
            easy to mix relaxed villa days with everything you need nearby.
          </p>
        </div>
        <div className="location-directory location-directory-featured">
          {closeToHome.map((place) => <DirectoryCard {...place} key={place.name} />)}
        </div>
      </section>

      <section className="section dining-guide-section">
        <div className="section-heading">
          <span className="eyebrow">From marina favourites to destination dining</span>
          <h2>Restaurants worth discovering</h2>
          <p>Distances are approximate from Coco Palms and are included as a simple planning guide.</p>
        </div>
        <div className="location-directory">
          {restaurants.map((restaurant) => <DirectoryCard {...restaurant} key={restaurant.name} />)}
        </div>
      </section>

      <section className="section mooring-charters">
        <div className="mooring-charters-copy">
          <span className="eyebrow light">Your private waterfront departure</span>
          <h2>Step aboard from Coco Palms</h2>
          <p>
            Barefoot Antigua, Antigua Vibes and Catch the Cat can pick you up directly from the Coco
            Palms mooring, turning a private charter into a genuinely door-to-deck experience.
          </p>
        </div>
        <div className="charter-list">
          {charters.map((charter) => <DirectoryCard {...charter} key={charter.name} />)}
        </div>
      </section>

      <section className="section amenities-section">
        <div className="section-heading">
          <span className="eyebrow">Made for an effortless stay</span>
          <h2>Villa amenities</h2>
        </div>
        <div className="amenities-grid">
          {amenities.map(([Icon, label]) => (
            <div className="amenity" key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section concierge-callout">
        <ConciergeBell aria-hidden="true" />
        <div>
          <span className="eyebrow">Here when you need us</span>
          <h2>Let our concierge take care of the details</h2>
          <p>
            Our on-island concierge can help with restaurant reservations, charter bookings and
            anything else you need to make your stay run smoothly.
          </p>
        </div>
      </section>

      <section className="quote-invitation section">
        <div>
          <span className="eyebrow light">Your dates, your party</span>
          <h2>Build your personalised quotation</h2>
        </div>
        <Link className="button button-gold" href="/rates-and-availability">Get Quotation</Link>
      </section>
    </>
  );
}
