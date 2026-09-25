import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LocationPage from "./page";

const expectedAmenities = [
  "Waterfront setting",
  "4 bedrooms",
  "3 bathrooms",
  "Fully fitted indoor kitchen",
  "Private swimming pool",
  "Private boat dock",
  "Outdoor kitchen",
  "Outdoor shower",
  "Kayaks and stand-up paddle boards",
  "Coffee machine",
  "Broadband with guest wifi",
  "Indoor and al fresco dining",
  "Smart TVs, cable and Apple TV",
  "AC and ceiling fans",
  "Dishwasher",
  "Laundry room with Washer & Dryer",
  "Ample off-road parking",
  "Gated community with 24/7 security",
  "On-island concierge services",
  "House keeping",
];

describe("Location and amenities page", () => {
  it("shows the complete villa amenities list", () => {
    const { container } = render(<LocationPage />);

    for (const amenity of expectedAmenities) {
      expect(screen.getByText(amenity)).toBeInTheDocument();
    }
    expect(screen.queryByText("Fire pit")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".amenity")).toHaveLength(20);
  });

  it("shows the revised location, nearby venue and booking copy", () => {
    render(<LocationPage />);

    expect(screen.getByRole("heading", { name: "Prime Jolly Harbour location, on the water" })).toBeInTheDocument();
    expect(screen.getByText("Coco Palms is situated on Harbour Island on Antigua’s West coast, within the gated Jolly Harbour community.")).toHaveClass("location-hero-summary");
    expect(screen.getByText("Fitness centre, swimming pool, volleyball, tennis and pickleball courts and café bar.")).toBeInTheDocument();
    expect(screen.getByText("The marina village brings together a supermarket, shops, cafés, bars, pharmacy and useful holiday services.")).toBeInTheDocument();
    expect(screen.getByText("Get directions to Jolly Harbour’s mile long white-sand Beach.")).toBeInTheDocument();
    expect(screen.getByText("Get directions to Jolly Harbour’s sheltered North Beach.")).toBeInTheDocument();
    expect(screen.getByText("Waterside Mediterranean dining with Harbour views.")).toBeInTheDocument();
    expect(screen.getByText("A relaxed public house and coastal kitchen with Marina views.")).toBeInTheDocument();
    expect(screen.getByText("The Rocks Group’s modern pantry, butcher and wine cellar at Sugar Ridge.")).toBeInTheDocument();
    expect(screen.getByText("Award winning clifftop dining, daybeds and sunset views above Little Ffryes Beach.")).toBeInTheDocument();
    expect(screen.getByText("Iconic harbour views, and the famous Reggae Heights BBQ party with live music")).toBeInTheDocument();
    expect(screen.getByText("A destination beach restaurant on Little Jumby Island.")).toBeInTheDocument();
    expect(screen.getByText("Destination dining on Princess Diana Beach, Barbuda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Amenities at a glance" })).toBeInTheDocument();
    expect(screen.getByText("Secure your stay")).toBeInTheDocument();
  });

  it("describes the on-island concierge service", () => {
    render(<LocationPage />);

    expect(screen.getByText("Here when you need us")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Let our concierge take care of the details" })).toBeInTheDocument();
    expect(screen.getByText("If you’re craving adventure or looking for special touches to make your experience truly unforgettable, our on-island concierge can craft an itinerary that’s perfect for you.")).toBeInTheDocument();
  });

  it("introduces the setting and the six supplied location photographs", () => {
    render(<LocationPage />);

    expect(screen.getByText(/Coco Palms is situated on Harbour Island/)).toBeInTheDocument();
    expect(screen.getAllByTestId("location-mosaic-image")).toHaveLength(6);
    expect(screen.queryByRole("img", { name: /location collage/i })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /sunrise across Jolly Harbour/i })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Flocation%2Fcoco-palms-mooring-twilight.jpg"),
    );
    expect(screen.getByRole("img", { name: /kayaks and paddleboards lined up on the private dock/i })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Flocation%2Fkayaks-and-paddleboards.jpg"),
    );
    expect(screen.getByRole("img", { name: /Shirley Heights overlooking English and Falmouth Harbours/i })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Flocation%2Fshirley-heights.jpg"),
    );
    expect(screen.getByText(/leave by boat directly from the private dock/i)).toBeInTheDocument();
    expect(screen.getByText(/Antigua’s iconic oceanside locations and historic harbours are within easy reach/i)).toBeInTheDocument();
  });

  it("provides nearby recommendations, useful distances and booking links", () => {
    render(<LocationPage />);

    expect(screen.getByRole("heading", { name: "Explore Antigua’s vibrant culinary scene" })).toBeInTheDocument();

    for (const venue of [
      "Jolly Harbour village",
      "Jolly Harbour Sports Village",
      "South Beach (Jolly Beach)",
      "North Beach",
      "Al Porto",
      "Fat Urchin",
      "Roca Pantry, Butcher’s Block & Wine Cellar",
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
    expect(screen.getByRole("link", { name: /Roca Pantry/i })).toHaveAttribute("href", "https://roca-antigua.com/");
    expect(screen.getByRole("link", { name: "Wild Tamarind" }).closest("article")).toHaveTextContent("Ffryes Beach");
  });

  it("lists private catering at the villa before Al Porto", () => {
    const { container } = render(<LocationPage />);
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".dining-guide-section .location-directory-card"));
    const cateringLink = screen.getByRole("link", { name: "Rock Groups Events" });

    expect(cards[0]).toContainElement(cateringLink);
    expect(cards[1]).toContainElement(screen.getByRole("link", { name: "Al Porto" }));
    expect(cateringLink).toHaveAttribute(
      "href",
      "https://sheer-rocks.com/wp-content/uploads/2025/03/Rocks-Group-Private-Chef-Catering.pdf",
    );
    expect(cards[0]).toHaveTextContent("Private chef, catering and tailored fine dining experiences");
    expect(cards[0]).toHaveTextContent("0 miles");
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
      "https://www.google.com/maps/dir/?api=1&origin=Coco+Palms%2C+Jolly+Harbour%2C+Antigua&destination=17.0670921%2C-61.8885747&travelmode=driving",
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
      ["South Beach (Jolly Beach)", "Approx. 1.6 miles"],
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
      "Explore local flavours, freshly caught sea food and international cuisine with ease.",
    );
  });

  it("features charters collecting from the mooring and concierge support", () => {
    render(<LocationPage />);

    expect(screen.getByRole("link", { name: /Barefoot Antigua/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Antigua Vibes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Catch the Cat/i })).toBeInTheDocument();
    expect(screen.getByText(/pick you up directly from the Coco Palms mooring/i)).toBeInTheDocument();
    expect(screen.getByText(/our on-island concierge can craft an itinerary that’s perfect for you/i)).toBeInTheDocument();
  });
});
