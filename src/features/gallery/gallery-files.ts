type GalleryFile = {
  position: number;
  src: string;
  label: string;
  alt: string;
  mediaType?: "video";
  poster?: string;
};

export function galleryImagesFromFilenames(section: string, title: string, files: string[]): GalleryFile[] {
  return files
    .flatMap((file) => {
      const imageMatch = /^image([1-9]\d*)\.(jpe?g|png|webp)$/i.exec(file);
      if (imageMatch) {
        const position = Number(imageMatch[1]);
        return [{ position, src: `/images/gallery/${section}/${file}`, label: `${title} ${position}`, alt: `${title} ${position}` }];
      }

      const videoMatch = /^image([1-9]\d*)\.mp4$/i.exec(file);
      if (!videoMatch) return [];
      const position = Number(videoMatch[1]);
      return [{
        position,
        src: `/images/gallery/${section}/${file}`,
        poster: `/images/gallery/${section}/image${position}-poster.jpg`,
        mediaType: "video" as const,
        label: `${title} ${position}`,
        alt: `${title} ${position}`,
      }];
    })
    .toSorted((left, right) => left.position - right.position);
}
