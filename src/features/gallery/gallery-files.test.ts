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

  it("recognises an MP4 gallery item and gives it a matching poster", () => {
    expect(galleryImagesFromFilenames("local-area", "Local Area", ["image12-poster.jpg", "image12.mp4"]))
      .toEqual([{
        position: 12,
        src: "/images/gallery/local-area/image12.mp4",
        poster: "/images/gallery/local-area/image12-poster.jpg",
        mediaType: "video",
        label: "Local Area 12",
        alt: "Local Area 12",
      }]);
  });

  it("recognises numbered photographs beyond the original twelve positions", () => {
    expect(galleryImagesFromFilenames("exterior", "Exterior", ["image22.JPG"]))
      .toEqual([{
        position: 22,
        src: "/images/gallery/exterior/image22.JPG",
        label: "Exterior 22",
        alt: "Exterior 22",
      }]);
  });
});
