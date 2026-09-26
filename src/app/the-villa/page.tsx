import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "The Villa", description: "Explore Coco Palms: a private 4-bedroom waterfront villa in Jolly Harbour, Antigua, sleeping up to 8 with a pool, boat dock and outdoor dining.", alternates: { canonical: "/the-villa" } };

const villaImages = [
  {
    src: "/images/coco-palms-home-page.jpeg",
    alt: "Aerial view of Coco Palms villa, pool and private dock",
    className: "location-photo location-photo-anchor",
  },
  {
    src: "/images/villa/great-room.jpg",
    alt: "Coco Palms great room beneath the vaulted ceiling",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/sunset-terrace.jpg",
    alt: "The covered Coco Palms terrace overlooking the harbour at sunset",
    className: "location-photo location-photo-night",
  },
  {
    src: "/images/villa/dining-area.jpg",
    alt: "Indoor dining for 8 in the Coco Palms great room",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/bedroom.jpg",
    alt: "Coco Palms bedroom with a four-poster bed",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/pool-at-dusk.jpeg",
    alt: "Coco Palms villa and private pool glowing at dusk",
    className: "location-photo location-photo-waterfront",
  },
] as const;

export default function VillaPage() {
  return <>
    <section className="page-hero villa-page-hero">
      <span className="eyebrow">The villa</span>
      <h1>Contemporary waterfront living</h1>
      <p>Built for easy days with family and friends, Coco Palms sleeps up to 8 guests across 4 spacious bedrooms.</p>
    </section>
    <section className="section split-feature">
      <div className="location-mosaic villa-mosaic" aria-label="Coco Palms villa views">
        {villaImages.map((image) => <figure className={image.className} key={image.src}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
            data-testid="villa-mosaic-image"
          />
        </figure>)}
      </div>
      <div>
        <span className="eyebrow">Room to gather</span>
        <h2 className="balanced-heading"><span>Bright, open and</span><span>made for sharing</span></h2>
        <p>The great room brings the kitchen, dining and living spaces together beneath a high vaulted ceiling. Wide doors open directly to the covered terrace, pool and harbour beyond.</p>
        <ul className="feature-list">
          <li>4 spacious bedrooms</li>
          <li>Two ensuite bathrooms plus a house bathroom</li>
          <li>Private swimming pool</li>
          <li>Covered outdoor kitchen with BBQ, bar area and dining for 10</li>
          <li>Private boat dock and waterside lounging deck</li>
          <li>Set within Jolly Harbour’s gated community with 24/7 security</li>
          <li>Kayaks and paddleboards for aqua adventures</li>
          <li>AC in all bedrooms</li>
        </ul>
        <Link className="button" href="/rates-and-availability">Get Quotation</Link>
      </div>
    </section>
  </>;
}
