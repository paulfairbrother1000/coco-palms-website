import { describe, expect, it } from "vitest";
import { galleryImagesFromFilenames } from "./gallery-files";

describe("galleryImagesFromFilenames", () => {
  it("uses image1 through image12 as the display positions", () => {
    expect(galleryImagesFromFilenames("exterior", "Exterior", ["image12.jpg", "notes.txt", "image2.jpg", "img3.jpg", "image1.jpg"]))
      .toEqual([
        { position: 1, src: "/images/gallery/exterior/image1.jpg", label: "Exterior 1", alt: "Exterior 1" },
        { position: 2, src: "/images/gallery/exterior/image2.jpg", label: "Exterior 2", alt: "Exterior 2" },
        { position: 12, src: "/images/gallery/exterior/image12.jpg", label: "Exterior 12", alt: "Exterior 12" },
      ]);
  });
});
