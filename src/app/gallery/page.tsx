import Image from "next/image";
import { readdirSync } from "node:fs";
import path from "node:path";
import { buildGallerySlots } from "@/features/gallery/build-gallery-slots";
import { galleryImagesFromFilenames } from "@/features/gallery/gallery-files";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const metadata = { title: "Gallery", description: "See Coco Palms villa photos: the interior, pool, waterfront terraces, private dock and beaches around Jolly Harbour, Antigua.", alternates: { canonical: "/gallery" } };
export const revalidate = 300;

const fallbackSections = [
  { id: "interior", title: "Interior", copy: "Contemporary spaces to wake up in paradise, relax and recharge." },
  { id: "exterior", title: "Exterior", copy: "Boat dock, private pool and waterside terraces, built for outdoor living." },
  { id: "local-area", title: "Local Area", copy: "Beyond the villa, discover Antigua’s beaches, historic harbours and island vibe." },
];

const galleryDisplayOrders: Record<string, number[]> = {
  interior: [1, 13, 2, 3, 14, 4, 15, 5, 6, 16, 7, 17, 8, 9, 18, 10, 11, 12],
  exterior: [1, 13, 2, 14, 3, 15, 4, 16, 5, 17, 6, 18, 7, 19, 8, 20, 9, 21, 10, 22, 11, 12],
  "local-area": [1, 2, 13, 3, 4, 5, 14, 6, 7, 8, 15, 9, 10, 11, 16, 12],
};

const omittedGalleryPositions: Record<string, ReadonlySet<number>> = {
  interior: new Set([5, 6, 7, 8]),
  exterior: new Set([3, 5, 8, 10]),
  "local-area": new Set([6, 12, 15]),
};

const localAreaCaptions = [
  "Beachfront relaxation at Salt Plage on Dickenson Bay",
  "Historic Nelson’s Dockyard, a UNESCO World Heritage Site",
  "Relaxed beachfront dining at Catherine’s Café",
  "Contemporary Asian-inspired dining at Rokuni",
  "Sheer Rocks’ spectacular clifftop dining setting",
  "Beautifully presented Caribbean flavours at Sheer Rocks",
  "Miracles restaurant, close to the entrance of Jolly Harbour",
  "Waterside Mediterranean dining at Al Porto in Jolly Harbour",
  "Floodlit tennis courts at Jolly Harbour Sports Village",
  "Floodlit pickleball courts at Jolly Harbour Sports Village",
  "Fully equipped, air-conditioned, 6,000 sq. ft. gym at Jolly Harbour Sports Village",
  "Nearby Jolly Beach",
  "White sands and endless Caribbean blue on Barbuda",
  "Morning walks on nearby Jolly Beach",
  "The shoreline at golden hour",
  "Sunset, Antigua style",
];

const exteriorCaptions = [
  "Sundowner spaces. Perfect for sharing",
  "Covered terrace with sunset views across the harbour",
  "Sunset dining on the covered waterside terrace",
  "Poolside mornings with uninterrupted harbour views",
  "Exploring Jolly Harbour and the beaches beyond",
  "Golden sunset views from the private dock",
  "Outdoor kitchen and bar for relaxed poolside entertaining",
  "Generous covered lounge seating beside the pool",
  "Private boat dock",
  "", // Position 10 is omitted from the gallery.
  "Private swimming pool",
  "Outdoor kitchen overlooking the harbour at sunset",
  "Poolside dining with a harbour view",
  "Alfresco living",
  "Kayaks and paddleboards, ready for adventures on the water",
  "Spacious waterside seating",
  "Barefoot evenings outdoors",
  "Evenings made for poolside living",
  "Front row seats to spectacular sunsets",
  "Waterside lounging after sunset",
  "Coco Palms at sunrise",
  "Sunrise over Jolly Harbour",
];

const interiorCaptions = [
  "Indoor dining for 8 in the Great Room",
  "Spacious open-plan Lounge with comfortable seating and large-screen TV",
  "Fully equipped and modern Kitchen",
  "Ocean-facing Principal Bedroom suite with Emperor bed, dressing room, 55-inch TV, AC, ceiling fan, safe and ensuite Shower Room with twin basins, WC and walk-in rain shower",
  "Primary Bedroom suite with Eastern King bed, AC, ceiling fan, TV, safe and ensuite Bathroom with twin basins, freestanding bathtub and walk-in rain shower",
  "3rd Bedroom with 2 king-size beds, AC, ceiling fan, TV and safe",
  "4th Bedroom with Super King-size bed, AC, ceiling fan, TV and safe",
  "House Bathroom with twin basins, WC and walk-in rain shower",
  "Laundry Room with washer and dryer",
  "Open-plan Kitchen and lounging space beneath the vaulted ceiling",
  "Built-in bean-to-cup coffee machine for fresh coffee at any time",
  "Relax in the Primary Ensuite’s deep soaking bath",
  "Flexible bedroom space for family stays",
  "3rd bedroom with 2 Super King-Sized beds, ceiling fans, AC, safe and TV.",
  "Primary Bedroom suite with Eastern King bed, AC, ceiling fan, TV, safe and ensuite Bathroom with twin basins, freestanding bathtub and walk-in rain shower",
  "4th Bedroom with Super King-size bed, AC, ceiling fan, TV and safe",
  "The Great Room dressed for Christmas",
  "Poolside dining",
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

    const slots = buildGallerySlots({
      title,
      fallbackImage,
      images: [...databaseImages, ...localImages],
      captions: fallback.id === "interior"
        ? interiorCaptions
        : fallback.id === "exterior"
          ? exteriorCaptions
          : fallback.id === "local-area"
            ? localAreaCaptions
            : undefined,
    }).filter((slot) => !omittedGalleryPositions[fallback.id]?.has(slot.position));
    const displayOrder = galleryDisplayOrders[fallback.id] ?? slots.map((slot) => slot.position);
    const displayRank = new Map(displayOrder.map((position, index) => [position, index]));

    return {
      ...fallback,
      title,
      copy: fallback.copy,
      slots: slots.toSorted((left, right) =>
        (displayRank.get(left.position) ?? displayOrder.length + left.position)
        - (displayRank.get(right.position) ?? displayOrder.length + right.position)),
    };
  });

  return <>
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
          </div> : <div className={slot.mediaType === "video" ? "gallery-media gallery-video-media" : "gallery-media"}>
            {slot.mediaType === "video"
              ? <video aria-label={slot.alt} controls playsInline preload="metadata" poster={slot.poster} src={slot.src} />
              : <Image className={`gallery-image-original gallery-image-${section.id}-${slot.position}`} src={slot.src} alt={slot.alt} fill sizes="(max-width: 800px) 100vw, 50vw" unoptimized={slot.src.startsWith("http")} />}
          </div>}
          <figcaption>{slot.label}</figcaption>
        </figure>)}
      </div>
    </section>)}
  </>;
}
