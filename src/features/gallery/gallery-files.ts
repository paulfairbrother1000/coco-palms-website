export function galleryImagesFromFilenames(section: string, title: string, files: string[]) {
  return files
    .flatMap((file) => {
      const match = /^image([1-9]|1[0-2])\.(jpe?g|png|webp)$/i.exec(file);
      if (!match) return [];
      const position = Number(match[1]);
      return [{ position, src: `/images/gallery/${section}/${file}`, label: `${title} ${position}`, alt: `${title} ${position}` }];
    })
    .toSorted((left, right) => left.position - right.position);
}
