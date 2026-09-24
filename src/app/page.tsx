import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bath, BedDouble, ConciergeBell, MapPin, Users, Waves, WavesLadder } from "lucide-react";

const tiles = [
  { title: "Interior", href: "/gallery#interior", image: "/images/interior-7.jpg", copy: "Light-filled spaces designed for relaxed time together." },
  { title: "Exterior", href: "/gallery#exterior", image: "/images/gallery/exterior/image1.jpg", copy: "Waterfront terraces, poolside lounging and front-row seats for sunset over the harbour." },
  { title: "Local Area", href: "/gallery#local-area", image: "/images/gallery/local-area/image1.jpg", copy: "Clear turquoise waters, white-sand beaches and all the colour of Antigua close at hand." },
];

export default function HomePage() {
  return <>
    <section className="hero">
      <Image src="/images/villa-hero.jpg" alt="Coco Palms pool and covered waterfront terrace" fill priority quality={92} sizes="100vw" />
      <div className="hero-content"><div className="hero-copy-panel"><span className="eyebrow light">Jolly Harbour · Antigua</span><h1 className="hero-title">Welcome to Coco Palms</h1><p className="hero-subtitle">Your private waterfront escape in the Caribbean.</p><div className="hero-actions"><Link className="button" href="/rates-and-availability">Get Quotation</Link></div></div></div>
    </section>
    <section className="highlights" aria-label="Villa highlights"><span><Waves />Waterfront</span><span><Users />Sleeps 8</span><span><BedDouble />4 bedrooms</span><span><Bath />3 bathrooms</span><span><WavesLadder />Private pool</span><span><ConciergeBell />Concierge</span><span><MapPin />Jolly Harbour</span></section>
    <section className="intro section"><div className="intro-copy"><span className="eyebrow">Welcome to Coco Palms</span><h2>Space to slow down, right on the water</h2><p>Welcome to Coco Palms, an exclusive luxury villa where turquoise Caribbean waters and soft white sands are just moments from your door. Perfectly designed for families and friends, this private sanctuary features expansive living spaces, a private pool and dedicated concierge service to tailor every detail of your stay – leaving you free to relax or explore Antigua’s natural beauty.</p><Link className="text-link" href="/the-villa">Explore the villa <ArrowRight size={18} /></Link></div><div className="intro-image"><Image src="/images/cocopalmshero4.jpg" alt="Coco Palms outdoor living beside the pool" fill sizes="(max-width: 900px) 100vw, 55vw" /></div></section>
    <section className="tile-section section"><div className="section-heading"><span className="eyebrow">Take a look around</span><h2 className="tile-section-title">Inside, outside and across Antigua</h2></div><div className="tile-grid">{tiles.map((tile) => <Link className="image-tile" href={tile.href} key={tile.title}><Image src={tile.image} alt={tile.title} fill sizes="(max-width: 800px) 100vw, 33vw" /><div className="tile-overlay"><h3>{tile.title}</h3><p className="tile-copy">{tile.copy}</p><span>View gallery <ArrowRight size={17} /></span></div></Link>)}</div></section>
    <section className="quote-invitation section"><div><span className="eyebrow light">Plan your stay</span><h2>See your personalised quotation in moments</h2><p>Choose your dates and party size. We will check current availability and calculate the price, including fees and taxes.</p></div><Link className="button button-gold" href="/rates-and-availability">Get Quotation</Link></section>
  </>;
}
