import Link from "next/link";
import { SocialLinks } from "./social-links";

export function SiteFooter() {
  return <footer className="site-footer">
    <div><span className="eyebrow">Coco Palms Antigua</span><p>A private waterfront villa in Jolly Harbour, Antigua.</p></div>
    <div className="footer-links"><Link href="/rates-and-availability">Get Quotation</Link><Link href="/contact">Contact</Link><SocialLinks /></div>
    <p className="copyright">© {new Date().getFullYear()} Coco Palms Antigua</p>
  </footer>;
}
