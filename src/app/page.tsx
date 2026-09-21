import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, Palmtree, Users, Waves } from "lucide-react";

const tiles = [
  { title: "Interior", href: "/gallery#interior", image: "/images/interior-7.jpg", copy: "Light-filled spaces designed for relaxed time together." },
  { title: "Exterior", href: "/gallery#exterior", image: "/images/gallery/exterior/image1.jpg", copy: "Waterfront terraces, poolside living and sunsets over the harbour." },
  { title: "Local Area", href: "/gallery#local-area", image: "/images/gallery/local-area/image1.jpg", copy: "Sailing, beaches and the colour of Antigua close at hand." },
];

export default function HomePage() {
  return <>
    <section className="hero">
      <Image src="/images/cocopalmshero2.jpg" alt="Coco Palms pool and covered waterfront terrace" fill priority quality={92} sizes="100vw" />
      <div className="hero-shade" />
      <div className="hero-content"><span className="eyebrow light">Jolly Harbour · Antigua</span><h1 className="hero-title">Welcome to Coco Palms</h1><p>Your private waterfront escape in the Caribbean.</p><div className="hero-actions"><Link className="button" href="/get-quotation">Get Quotation</Link><Link className="text-link light" href="/rates-and-availability">View availability <ArrowRight size={18} /></Link></div></div>
    </section>
    <section className="highlights" aria-label="Villa highlights"><span><Waves />Waterfront</span><span><Users />Sleeps 8</span><span><BedDouble />4 bedrooms</span><span><Palmtree />Private pool</span><span><MapPin />Jolly Harbour</span></section>
    <section className="intro section"><div className="intro-copy"><span className="eyebrow">Welcome to Coco Palms</span><h2>Space to slow down, right on the water</h2><p>Coco Palms is a contemporary four-bedroom villa on Harbour Island in the gated Jolly Harbour community. Gather around the pool, dine beneath the covered terrace and step onto the private dock as the sun settles over the water.</p><Link className="text-link" href="/the-villa">Explore the villa <ArrowRight size={18} /></Link></div><div className="intro-image"><Image src="/images/cocopalmshero4.jpg" alt="Coco Palms outdoor living beside the pool" fill sizes="(max-width: 900px) 100vw, 55vw" /></div></section>
    <section className="tile-section section"><div className="section-heading"><span className="eyebrow">Take a look around</span><h2>Inside, outside and across Antigua</h2></div><div className="tile-grid">{tiles.map((tile) => <Link className="image-tile" href={tile.href} key={tile.title}><Image src={tile.image} alt={tile.title} fill sizes="(max-width: 800px) 100vw, 33vw" /><div className="tile-overlay"><h3>{tile.title}</h3><p>{tile.copy}</p><span>View gallery <ArrowRight size={17} /></span></div></Link>)}</div></section>
    <section className="quote-invitation section"><div><span className="eyebrow light">Plan your stay</span><h2>See your personalised quotation in moments</h2><p>Choose your dates and party size. We will check current availability and calculate the stay using Coco Palms’ published rates, taxes and fees.</p></div><Link className="button button-gold" href="/get-quotation">Get Quotation</Link></section>
  </>;
}
