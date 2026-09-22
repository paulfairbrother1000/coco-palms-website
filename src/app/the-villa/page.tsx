import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "The Villa" };

const villaImages = [
  {
    src: "/images/coco-palms-home-page.jpeg",
    alt: "Aerial view of Coco Palms villa, pool and private dock",
    className: "location-photo location-photo-anchor",
  },
  {
    src: "/images/villa/pool-waterline.jpg",
    alt: "Coco Palms terrace viewed across the swimming pool",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/sunset-terrace.jpg",
    alt: "The covered Coco Palms terrace overlooking the harbour at sunset",
    className: "location-photo location-photo-night",
  },
  {
    src: "/images/villa/pool-at-night.jpg",
    alt: "The illuminated Coco Palms pool and terrace at night",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/pool-and-dock-aerial.jpg",
    alt: "Aerial view of the Coco Palms pool beside the private dock",
    className: "location-photo location-photo-portrait",
  },
  {
    src: "/images/villa/waterfront-aerial.jpg",
    alt: "Coco Palms pool, waterfront deck and private mooring from above",
    className: "location-photo location-photo-waterfront",
  },
] as const;

export default function VillaPage() {
  return <>
    <section className="page-hero">
      <span className="eyebrow">The villa</span>
      <h1>Contemporary waterfront living</h1>
      <p>Built for easy days with family and friends, Coco Palms sleeps up to eight guests across four spacious bedrooms.</p>
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
        <h2>Bright, open and made for sharing</h2>
        <p>The great room brings the kitchen, dining and living spaces together beneath a high vaulted ceiling. Wide doors open directly to the covered terrace, pool and harbour beyond.</p>
        <ul className="feature-list">
          <li>Four spacious bedrooms</li>
          <li>Two ensuite bathrooms plus a house bathroom</li>
          <li>Private swimming pool and waterside lounging deck</li>
          <li>Covered outdoor dining and bar area</li>
          <li>Private dock</li>
          <li>Gated Jolly Harbour setting</li>
        </ul>
        <Link className="button" href="/rates-and-availability">Get Quotation</Link>
      </div>
    </section>
  </>;
}
