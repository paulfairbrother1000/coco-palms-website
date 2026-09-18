import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LocationPage from "./page";

const expectedAmenities = [
  "Waterfront setting",
  "Four bedrooms",
  "Full kitchen",
  "Private swimming pool",
  "Private boat dock",
  "Outdoor kitchen",
  "Outdoor shower",
  "Kayaks and stand-up paddle boards",
  "Coffee machine",
  "Broadband with guest wifi",
  "Indoor and al fresco dining",
  "Smart TVs, cable and Apple TV",
  "AC and ceiling fans in all rooms",
  "Dishwasher",
  "Laundry room with Washer & Dryer",
  "Ample off-road parking",
  "Gated community with 24/7 security",
  "On-island concierge services",
];

describe("Location and amenities page", () => {
  it("shows the complete villa amenities list", () => {
    const { container } = render(<LocationPage />);

    for (const amenity of expectedAmenities) {
      expect(screen.getByText(amenity)).toBeInTheDocument();
    }
    expect(screen.queryByText("Fire pit")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".amenity")).toHaveLength(18);
  });

  it("shows the Coco Palms location collage beneath the Google Maps link", () => {
    render(<LocationPage />);

    const mapLink = screen.getByRole("link", { name: "Open in Google Maps" });
    const collage = screen.getByRole("img", {
      name: "Coco Palms villa, pool, private dock and waterfront views",
    });

    expect(mapLink.nextElementSibling).toBe(collage);
    expect(mapLink.parentElement).toBe(collage.parentElement);
  });
});
