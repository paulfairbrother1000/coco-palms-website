type GalleryImage = {
  position?: number;
  src: string;
  label: string;
  alt: string;
  mediaType?: "image" | "video";
  poster?: string;
};

export type GallerySlot =
  | (GalleryImage & { position: number; placeholder: false })
  | { position: number; label: string; placeholder: true };

type BuildGallerySlotsInput = {
  title: string;
  fallbackImage: GalleryImage;
  images: GalleryImage[];
  captions?: string[];
};

export function buildGallerySlots({ title, fallbackImage, images, captions }: BuildGallerySlotsInput): GallerySlot[] {
  return Array.from({ length: 12 }, (_, index) => {
    const position = index + 1;
    const image = images.find((candidate) => candidate.position === position) ?? (position === 1 ? fallbackImage : undefined);

    if (image) {
      const caption = captions?.[index];
      return caption
        ? {
            ...image,
            position,
            label: caption,
            alt: image.mediaType === "video" ? `${caption} video` : caption,
            placeholder: false as const,
          }
        : { ...image, position, placeholder: false as const };
    }

    return { position, label: `${title} ${position}`, placeholder: true };
  });
}
