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
  "Fire pit",
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
    expect(container.querySelectorAll(".amenity")).toHaveLength(19);
  });
});
