import { describe, expect, it } from "vitest";
import { buildGallerySlots } from "./build-gallery-slots";

describe("buildGallerySlots", () => {
  it("keeps twelve visible positions and fills empty ones with labelled placeholders", () => {
    const slots = buildGallerySlots({
      title: "Exterior",
      fallbackImage: {
        src: "/images/rear-exterior.jpg",
        label: "Coco Palms from the water",
        alt: "Coco Palms from the water",
      },
      images: [],
    });

    expect(slots).toHaveLength(12);
    expect(slots[0]).toEqual({
      position: 1,
      src: "/images/rear-exterior.jpg",
      label: "Coco Palms from the water",
      alt: "Coco Palms from the water",
      placeholder: false,
    });
    expect(slots[11]).toEqual({
      position: 12,
      label: "Exterior 12",
      placeholder: true,
    });
  });

  it("replaces the matching position with its published gallery image", () => {
    const slots = buildGallerySlots({
      title: "Interior",
      fallbackImage: {
        src: "/images/interior-great-room.jpg",
        label: "The great room",
        alt: "The great room",
      },
      images: [
        {
          position: 3,
          src: "https://example.com/bedroom.jpg",
          label: "Bedroom 1",
          alt: "Bedroom with waterfront view",
        },
      ],
    });

    expect(slots[2]).toEqual({
      position: 3,
      src: "https://example.com/bedroom.jpg",
      label: "Bedroom 1",
      alt: "Bedroom with waterfront view",
      placeholder: false,
    });
  });

  it("applies approved captions to published database images", () => {
    const slots = buildGallerySlots({
      title: "Interior",
      fallbackImage: {
        src: "/images/interior-great-room.jpg",
        label: "The great room",
        alt: "The great room",
      },
      images: [
        {
          position: 1,
          src: "https://example.com/dining.jpg",
          label: "Old database caption",
          alt: "Old database alt text",
        },
      ],
      captions: ["Indoor dining for 8 in the great room."],
    });

    expect(slots[0]).toEqual({
      position: 1,
      src: "https://example.com/dining.jpg",
      label: "Indoor dining for 8 in the great room.",
      alt: "Indoor dining for 8 in the great room.",
      placeholder: false,
    });
  });

  it("expands beyond twelve positions when a collection contains more images", () => {
    const slots = buildGallerySlots({
      title: "Exterior",
      fallbackImage: {
        src: "/images/rear-exterior.jpg",
        label: "Coco Palms from the water",
        alt: "Coco Palms from the water",
      },
      images: [{
        position: 22,
        src: "/images/gallery/exterior/image22.JPG",
        label: "Sunset over Jolly Harbour.",
        alt: "Sunset over Jolly Harbour.",
      }],
    });

    expect(slots).toHaveLength(22);
    expect(slots[21]).toMatchObject({
      position: 22,
      src: "/images/gallery/exterior/image22.JPG",
      placeholder: false,
    });
  });
});
