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

    expect(screen.getByRole("heading", { name: "Restaurants to discover" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Restaurants worth discovering" })).not.toBeInTheDocument();

    for (const venue of [
      "Jolly Harbour village",
      "Jolly Harbour Sports Village",
      "South Beach (Jolly Beach)",
      "North Beach",
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
      expect(screen.getByRole("link", { name: venue })).toBeInTheDocument();
    }
    expect(screen.queryByText(/^Palms$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Approx\./i).length).toBeGreaterThanOrEqual(12);
    expect(screen.getByRole("link", { name: /Al Porto/i })).toHaveAttribute("href", "https://www.instagram.com/alporto_antigua/");
    expect(screen.getByRole("link", { name: /Miracles/i })).toHaveAttribute("href", "https://www.facebook.com/miraclesantigua/");
    expect(screen.getByRole("link", { name: /The Hut/i })).toHaveAttribute("href", "https://thehutlittlejumby.com/");
  });

  it("places Nobu Barbuda beside The Hut with its official link and boat distance", () => {
    const { container } = render(<LocationPage />);
    const restaurantCards = Array.from(
      container.querySelectorAll<HTMLElement>(".dining-guide-section .location-directory-card"),
    );
    const restaurantNames = restaurantCards.map((card) => card.querySelector("a")?.textContent?.trim());
    const theHutIndex = restaurantNames.indexOf("The Hut");
    const nobuIndex = restaurantNames.indexOf("Nobu Barbuda");
    const nobuLink = screen.getByRole("link", { name: "Nobu Barbuda" });

    expect(nobuIndex).toBe(theHutIndex + 1);
    expect(nobuLink).toHaveAttribute(
      "href",
      "https://www.noburestaurants.com/barbuda/contact-and-hours",
    );
    expect(nobuLink.closest("article")).toHaveTextContent("Approx. 31 nautical miles by boat");
  });

  it("links both nearby beaches to driving directions from Coco Palms", () => {
    render(<LocationPage />);

    expect(screen.getByRole("link", { name: /South Beach \(Jolly Beach\)/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&origin=Coco+Palms%2C+Jolly+Harbour%2C+Antigua&destination=Jolly+Beach%2C+Antigua&travelmode=driving",
    );
    expect(screen.getByRole("link", { name: /North Beach/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&origin=Coco+Palms%2C+Jolly+Harbour%2C+Antigua&destination=17.0760346%2C-61.8899019&travelmode=driving",
    );
  });

  it("shows verified driving distances from Coco Palms", () => {
    const { container } = render(<LocationPage />);
    const expectedDistances = [
      ["Jolly Harbour village", "Approx. 1.1 miles"],
      ["Jolly Harbour Sports Village", "Approx. 1.4 miles"],
      ["South Beach (Jolly Beach)", "Approx. 1.8 miles"],
      ["North Beach", "Approx. 0.7 miles"],
      ["Al Porto", "Approx. 0.7 miles"],
      ["Fat Urchin", "Approx. 0.9 miles"],
      ["Miracles", "Approx. 1.4 miles"],
      ["Rokuni", "Approx. 1.6 miles"],
      ["Sheer Rocks", "Approx. 2.8 miles"],
      ["Wild Tamarind", "Approx. 3 miles"],
      ["Catherine’s Café", "Approx. 15.5 miles"],
      ["Loose Cannon", "Approx. 15.7 miles"],
      ["Shirley Heights", "Approx. 16.4 miles"],
      ["The Hut", "Approx. 18 miles by boat"],
    ] as const;

    for (const [venue, distance] of expectedDistances) {
      const link = screen.getByRole("link", { name: venue });
      expect(link.closest("article")).toHaveTextContent(distance);
    }
    expect(container.querySelector(".dining-guide-section .section-heading p")).toHaveTextContent(
      "Driving distances are approximate from Coco Palms",
    );
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
