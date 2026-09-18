type GalleryImage = {
  position?: number;
  src: string;
  label: string;
  alt: string;
};

export type GallerySlot =
  | (GalleryImage & { position: number; placeholder: false })
  | { position: number; label: string; placeholder: true };

type BuildGallerySlotsInput = {
  title: string;
  fallbackImage: GalleryImage;
  images: GalleryImage[];
};

export function buildGallerySlots({ title, fallbackImage, images }: BuildGallerySlotsInput): GallerySlot[] {
  return Array.from({ length: 12 }, (_, index) => {
    const position = index + 1;
    const image = images.find((candidate) => candidate.position === position) ?? (position === 1 ? fallbackImage : undefined);

    if (image) return { ...image, position, placeholder: false };

    return { position, label: `${title} ${position}`, placeholder: true };
  });
}
