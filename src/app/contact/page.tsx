import { Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/features/contact/contact-form";
import { SocialLinks } from "@/components/social-links";

export const metadata={title:"Contact"};
export default function ContactPage(){return <><section className="page-hero"><span className="eyebrow">Contact</span><h1>Let’s plan your stay</h1><p>Ask a question about Coco Palms, your travel dates or the booking process.</p></section><section className="section contact-layout"><ContactForm/><aside className="contact-details"><span className="eyebrow">Coco Palms Antigua</span><h2>We’re here to help</h2><p><a className="contact-email-link" href="mailto:hello@cocopalms-antigua.com?subject=Coco%20Palms%20Enquiry"><Mail aria-hidden="true"/><span>hello@cocopalms-antigua.com</span></a></p><p><MapPin/> Coco Palms, Harbour Island, Jolly Harbour, St Mary’s, Antigua</p><h3>Follow Coco Palms</h3><SocialLinks/></aside></section></>}
