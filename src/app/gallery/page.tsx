import Image from "next/image";
import { readdirSync } from "node:fs";
import path from "node:path";
import { buildGallerySlots } from "@/features/gallery/build-gallery-slots";
import { galleryImagesFromFilenames } from "@/features/gallery/gallery-files";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata = { title: "Gallery" };
export const revalidate = 300;

const fallbackSections = [
  { id: "interior", title: "Interior", copy: "A calm, contemporary great room designed for time together." },
  { id: "exterior", title: "Exterior", copy: "Waterfront terraces, private pool and wide spaces for outdoor living." },
  { id: "local-area", title: "Local Area", copy: "Antigua’s harbours, beaches and sailing landscape beyond the villa." },
];

const localAreaCaptions = [
  "Historic Nelson’s Dockyard, a UNESCO World Heritage Site.",
  "Beachfront relaxation at Salt Plage.",
  "Relaxed beachfront dining at Catherine’s Café.",
  "Contemporary Asian-inspired dining at Rokuni.",
  "Sheer Rocks’ spectacular clifftop dining setting.",
  "Beautifully presented Caribbean flavours at Sheer Rocks.",
  "Miracles restaurant, close to the entrance of Jolly Harbour.",
  "Waterside Italian dining at Al Porto in Jolly Harbour.",
  "Tennis courts at the Jolly Harbour Sports Centre.",
  "Pickleball courts at the Jolly Harbour Sports Centre.",
  "The fully equipped gym at the Jolly Harbour Sports Centre.",
  "Discover Antigua’s turquoise water and the relaxed pace of Jolly Harbour.",
];

const exteriorCaptions = [
  "Wine and a sharing board beside the water.",
  "The covered terrace overlooking the pool and harbour at sunset.",
  "Sunset dining on the covered waterside terrace.",
  "Poolside mornings with uninterrupted harbour views.",
  "Complimentary kayaks ready for exploring Jolly Harbour.",
  "Golden sunset views from the private dock.",
  "Outdoor kitchen and bar for relaxed poolside entertaining.",
  "Generous covered lounge seating beside the pool.",
  "Direct boat access from the private Coco Palms dock.",
  "Al fresco dining beside the pool.",
  "The private swimming pool beneath the Antiguan sun.",
  "Outdoor kitchen overlooking the harbour at sunset.",
];

const interiorCaptions = [
  "Elegant indoor dining for eight, overlooking the lounge and pool.",
  "Spacious open-plan lounge with comfortable seating and a large-screen television.",
  "Fully equipped and modern kitchen.",
  "Ocean-facing bedroom with walk-in dressing room, 55-inch TV and ensuite bathroom with twin basins, shower and WC.",
  "Master bedroom – super-king-size bed, television and safe, with an ensuite bathroom featuring twin basins, shower, bath and WC.",
  "Bedroom 3 – two king-size beds, television, safe, wardrobe and drawers.",
  "Bedroom 4 – king-size bed, television, safe, wardrobe and drawers.",
  "House bathroom – twin basins, shower and WC.",
  "Utility room – washing and drying facilities.",
  "Open-plan kitchen and living space beneath a vaulted ceiling.",
  "Built-in bean-to-cup coffee machine for fresh coffee at any time.",
  "Relax in the master ensuite’s deep soaking bath.",
];

function localGalleryImages(section: string, title: string) {
  const directory = path.join(process.cwd(), "public", "images", "gallery", section);
  const images = galleryImagesFromFilenames(section, title, readdirSync(directory));
  const captions = section === "interior"
    ? interiorCaptions
    : section === "exterior"
      ? exteriorCaptions
    : section === "local-area"
      ? localAreaCaptions
      : null;
  if (!captions) return images;

  return images.map((image) => {
    const label = captions[image.position - 1] ?? image.label;
    return { ...image, label, alt: image.mediaType === "video" ? `${label} video` : label };
  });
}

export default async function GalleryPage() {
  let client: ReturnType<typeof createPublicSupabaseClient> | null = null;
  let dbSections: Array<{ id: string; slug: string; title: string; description: string }> = [];
  let dbImages: Array<{ section_id: string; storage_path: string; label: string; alt_text: string; position: number }> = [];
  try {
    client = createPublicSupabaseClient();
    const [sectionsResult, imagesResult] = await Promise.all([
      client.from("gallery_sections").select("id,slug,title,description").order("sort_order"),
      client.from("gallery_images").select("section_id,storage_path,label,alt_text,position").eq("published", true).order("position"),
    ]);
    dbSections = (sectionsResult.data ?? []) as typeof dbSections;
    dbImages = (imagesResult.data ?? []) as typeof dbImages;
  } catch {
    client = null;
  }

  const sections = fallbackSections.map((fallback) => {
    const section = dbSections?.find((value) => value.slug === fallback.id);
    const databaseImages = client ? dbImages
      .filter((image) => image.section_id === section?.id)
      .map((image) => ({
        position: image.position,
        src: client.storage.from("coco-palms-gallery").getPublicUrl(image.storage_path).data.publicUrl,
        label: image.label,
        alt: image.alt_text,
      })) : [];
    const title = section?.title ?? fallback.title;
    const localImages = localGalleryImages(fallback.id, title);
    const fallbackImage = localImages[0] ?? { src: "/images/cocopalmshero2.jpg", label: `${title} 1`, alt: `${title} 1` };

    return {
      ...fallback,
      title,
      copy: section?.description ?? fallback.copy,
      slots: buildGallerySlots({ title, fallbackImage, images: [...databaseImages, ...localImages] }),
    };
  });

  return <>
    <section className="page-hero">
      <span className="eyebrow">Gallery</span>
      <h1>Coco Palms and Antigua</h1>
    </section>
    {sections.map((section) => <section className="section gallery-section" id={section.id} key={section.id}>
      <div className="section-heading">
        <span className="eyebrow">Gallery collection</span>
        <h2>{section.title}</h2>
        <p>{section.copy}</p>
      </div>
      <div className="gallery-grid">
        {section.slots.map((slot) => <figure className={slot.placeholder ? "gallery-placeholder" : undefined} key={slot.position}>
          {slot.placeholder ? <div aria-label={`${slot.label} image placeholder`}>
            <span className="gallery-placeholder-number">{String(slot.position).padStart(2, "0")}</span>
            <span>Photo coming soon</span>
          </div> : <div>
            {slot.mediaType === "video"
              ? <video aria-label={slot.alt} controls playsInline preload="metadata" poster={slot.poster} src={slot.src} />
              : <Image src={slot.src} alt={slot.alt} fill sizes="(max-width: 800px) 100vw, 50vw" unoptimized={slot.src.startsWith("http")} />}
          </div>}
          <figcaption>{slot.label}</figcaption>
        </figure>)}
      </div>
    </section>)}
  </>;
}
