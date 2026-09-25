import Image from "next/image";
import Link from "next/link";
import {
  Anchor,
  Bath,
  BedDouble,
  BrushCleaning,
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
  [BedDouble, "4 bedrooms"],
  [Bath, "3 bathrooms"],
  [CookingPot, "Fully fitted indoor kitchen"],
  [Droplets, "Private swimming pool"],
  [Anchor, "Private boat dock"],
  [CookingPot, "Outdoor kitchen"],
  [ShowerHead, "Outdoor shower"],
  [Sailboat, "Kayaks and stand-up paddle boards"],
  [Coffee, "Coffee machine"],
  [Wifi, "Broadband with guest wifi"],
  [UtensilsCrossed, "Indoor and al fresco dining"],
  [Tv, "Smart TVs, cable and Apple TV"],
  [Fan, "AC and ceiling fans"],
  [Sparkles, "Dishwasher"],
  [WashingMachine, "Laundry room with Washer & Dryer"],
  [CarFront, "Ample off-road parking"],
  [ShieldCheck, "Gated community with 24/7 security"],
  [ConciergeBell, "On-island concierge services"],
  [BrushCleaning, "House keeping"],
] as const;

const locationImages = [
  {
    src: "/images/location/coco-palms-mooring-twilight.jpg",
    alt: "Sunrise across Jolly Harbour from the Coco Palms private dock",
    className: "location-photo location-photo-sunrise",
  },
  {
    src: "/images/location/coco-palms-sunset-terrace.jpg",
    alt: "Coco Palms terrace and pool beneath a pink Antiguan sunset",
    className: "location-photo location-photo-detail-top",
  },
  {
    src: "/images/location/shirley-heights.jpg",
    alt: "Shirley Heights overlooking English and Falmouth Harbours",
    className: "location-photo location-photo-detail-bottom",
  },
  {
    src: "/images/location/coco-palms-aerial.jpg",
    alt: "Aerial view of the Coco Palms pool, terrace, garden and private mooring",
    className: "location-photo location-photo-bottom-left",
  },
  {
    src: "/images/location/kayaks-and-paddleboards.jpg",
    alt: "Kayaks and paddleboards lined up on the private dock",
    className: "location-photo location-photo-bottom-middle",
  },
  {
    src: "/images/location/coco-palms-waterfront-sunset.jpg",
    alt: "Coco Palms viewed from its waterfront mooring beneath a golden sunset",
    className: "location-photo location-photo-bottom-right",
  },
] as const;

const closeToHome = [
  {
    name: "Jolly Harbour village",
    distance: "Approx. 1.1 miles",
    href: "https://www.jollyharbourantigua.com/",
    copy: "The marina village brings together a supermarket, shops, cafés, bars, pharmacy and useful holiday services.",
  },
  {
    name: "Jolly Harbour Sports Village",
    distance: "Approx. 1.4 miles",
    href: "https://www.jollyharbourantigua.com/sports-village/",
    copy: "Fitness centre, swimming pool, volleyball, tennis and pickleball courts and café bar.",
  },
  {
    name: "South Beach (Jolly Beach)",
    distance: "Approx. 1.6 miles",
    href: "https://www.google.com/maps/dir/?api=1&origin=Coco+Palms%2C+Jolly+Harbour%2C+Antigua&destination=17.0670921%2C-61.8885747&travelmode=driving",
    copy: "Get directions to Jolly Harbour’s mile long white-sand Beach.",
  },
  {
    name: "North Beach",
    distance: "Approx. 0.7 miles",
    href: "https://www.google.com/maps/dir/?api=1&origin=Coco+Palms%2C+Jolly+Harbour%2C+Antigua&destination=17.0760346%2C-61.8899019&travelmode=driving",
    copy: "Get directions to Jolly Harbour’s sheltered North Beach.",
  },
] as const;

const restaurants = [
  { name: "Rock Groups Events", distance: "0 miles", href: "https://sheer-rocks.com/wp-content/uploads/2025/03/Rocks-Group-Private-Chef-Catering.pdf", copy: "Hire a catering service to cook and wait on you in the comfort of the villa." },
  { name: "Al Porto", distance: "Approx. 0.7 miles", href: "https://www.instagram.com/alporto_antigua/", copy: "Waterside Mediterranean dining with Harbour views." },
  { name: "Fat Urchin", distance: "Approx. 0.9 miles", href: "https://faturchin.com/", copy: "A relaxed public house and coastal kitchen with Marina views." },
  { name: "Roca Pantry, Butcher’s Block & Wine Cellar", distance: "Approx. 1.6 miles", href: "https://roca-antigua.com/", copy: "The Rocks Group’s modern pantry, butcher and wine cellar at Sugar Ridge." },
  { name: "Miracles", distance: "Approx. 1.4 miles", href: "https://www.facebook.com/miraclesantigua/", copy: "A popular local restaurant close to the Jolly Harbour entrance." },
  { name: "Rokuni", distance: "Approx. 1.6 miles", href: "https://rokuni-antigua.com/", copy: "Asian-inspired sharing plates and cocktails at Sugar Ridge." },
  { name: "Sheer Rocks", distance: "Approx. 2.8 miles", href: "https://sheer-rocks.com/", copy: "Clifftop dining, daybeds and sunset views above Little Ffryes Beach." },
  { name: "Wild Tamarind", distance: "Approx. 3 miles", href: "https://www.instagram.com/wildtamarindrestaurant/", copy: "Contemporary Caribbean dining beside Ffryes Beach." },
  { name: "Catherine’s Café", distance: "Approx. 15.5 miles", href: "https://catherines-cafe.com/", copy: "French-inspired beachfront dining at Pigeon Point." },
  { name: "Loose Cannon", distance: "Approx. 15.7 miles", href: "https://www.loosecannonbeachbar.com/", copy: "A lively beach bar and restaurant on Galleon Beach." },
  { name: "Shirley Heights", distance: "Approx. 16.4 miles", href: "https://shirleyheightslookout.com/", copy: "Iconic harbour views, and the famous Reggae Heights BBQ party with live music" },
  { name: "The Hut", distance: "Approx. 18 miles by boat", href: "https://thehutlittlejumby.com/", copy: "A destination beach restaurant on Little Jumby Island." },
  { name: "Nobu Barbuda", distance: "Approx. 31 nautical miles by boat", href: "https://www.noburestaurants.com/barbuda/contact-and-hours", copy: "Destination dining on Princess Diana Beach, Barbuda." },
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
        <h1>Prime Jolly Harbour location, on the water</h1>
        <p className="location-hero-summary">
          Coco Palms is situated on Harbour Island on Antigua’s West coast, within the gated Jolly Harbour community.
        </p>
      </section>

      <section className="section location-introduction">
        <div className="location-intro-copy">
          <span className="eyebrow">At home on the harbour</span>
          <h2>A relaxed base for discovering Antigua</h2>
          <p>
            Spend slow mornings beside the pool, leave by boat directly from the private dock and
            explore the beaches, restaurants, shops and activities around Jolly Harbour. Antigua’s
            iconic oceanside locations and historic harbours are within easy reach.
          </p>
          <a className="text-link" href="https://goo.gl/maps/JfrmfU2js8Hwmnqq8" target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" /> Open Coco Palms in Google Maps
          </a>
        </div>
        <div className="location-mosaic location-area-mosaic" aria-label="Coco Palms waterfront views">
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
          <h2>Great cuisine is all around</h2>
          <p>Driving distances are approximate from Coco Palms and are included as a simple planning guide.</p>
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
          <h2>Amenities at a glance</h2>
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
            If you’re craving adventure or looking for special touches to make your experience
            truly unforgettable, our on-island concierge can craft an itinerary that’s perfect for you.
          </p>
        </div>
      </section>

      <section className="quote-invitation section">
        <div>
          <span className="eyebrow light">Secure your stay</span>
          <h2>Build your personalised quotation</h2>
        </div>
        <Link className="button button-gold" href="/rates-and-availability">Get Quotation</Link>
      </section>
    </>
  );
}
