import Link from "next/link";
import { SocialLinks } from "./social-links";

export function SiteFooter() {
  return <footer className="site-footer">
    <div><span className="eyebrow">Coco Palms Antigua</span><p>Luxury villa in the heart of the Caribbean</p></div>
    <div className="footer-links"><Link href="/rates-and-availability">Check Availability</Link><Link href="/contact">Contact</Link><SocialLinks /></div>
    <p className="copyright">© {new Date().getFullYear()} Coco Palms Antigua</p>
  </footer>;
}
