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

  it("introduces the setting and the six supplied location photographs", () => {
    render(<LocationPage />);

    expect(screen.getByText(/Coco Palms is situated on Harbour Island/)).toBeInTheDocument();
    expect(screen.getAllByTestId("location-mosaic-image")).toHaveLength(6);
    expect(screen.queryByRole("img", { name: /location collage/i })).not.toBeInTheDocument();
  });

  it("provides nearby recommendations, useful distances and booking links", () => {
    render(<LocationPage />);

    for (const venue of [
      "Jolly Harbour village",
      "Jolly Harbour Sports Village",
      "Al Porto",
      "Fat Urchin",
      "Sheer Rocks",
      "Rokuni",
      "Catherine’s Café",
      "Wild Tamarind",
      "Loose Cannon",
      "The Hut",
      "Miracles",
      "Shirley Heights",
    ]) {
      expect(screen.getByRole("link", { name: new RegExp(venue, "i") })).toBeInTheDocument();
    }
    expect(screen.queryByText(/^Palms$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Approx\./i).length).toBeGreaterThanOrEqual(12);
  });

  it("features charters collecting from the mooring and concierge support", () => {
    render(<LocationPage />);

    expect(screen.getByRole("link", { name: /Barefoot Antigua/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Antigua Vibes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Catch the Cat/i })).toBeInTheDocument();
    expect(screen.getByText(/pick you up directly from the Coco Palms mooring/i)).toBeInTheDocument();
    expect(screen.getByText(/concierge can help with restaurant reservations, charter bookings and anything else/i)).toBeInTheDocument();
  });
});
