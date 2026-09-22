import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GalleryPage from "./page";

describe("gallery page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders the local gallery when public Supabase configuration is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    render(await GalleryPage());

    expect(screen.getByRole("heading", { name: "Coco Palms and Antigua" })).toBeInTheDocument();
    expect(screen.queryByText(/Each collection has room for 12 photographs/i)).not.toBeInTheDocument();
    const interiorCaptions = [
      "Elegant indoor dining for eight, overlooking the lounge and pool.",
      "Spacious open-plan lounge with comfortable seating and a large-screen television.",
      "Fully equipped and modern kitchen.",
      "Ocean-facing bedroom with walk-in dressing room, 55-inch TV and ensuite bathroom with twin basins, shower and WC.",
      "Master bedroom – super-king-size bed, television and safe, with an ensuite bathroom featuring twin basins, shower, bath and WC.",
      "Bedroom 3 – two king-size beds, television, safe, wardrobe and drawers.",
      "Bedroom 4 – king-size bed, television, safe, wardrobe and drawers.",
      "House bathroom – twin basins, shower and WC.",
      "Utility room – washing and drying facilities.",
      "Open-plan kitchen and living space beneath a vaulted ceiling.",
      "Built-in bean-to-cup coffee machine for fresh coffee at any time.",
      "Relax in the master ensuite’s deep soaking bath.",
    ];

    for (const caption of interiorCaptions) {
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText(/Interior \d+ image placeholder/)).not.toBeInTheDocument();

    const exteriorCaptions = [
      "Wine and a sharing board beside the water.",
      "The covered terrace overlooking the pool and harbour at sunset.",
      "Sunset dining on the covered waterside terrace.",
      "Poolside mornings with uninterrupted harbour views.",
      "Complimentary kayaks ready for exploring Jolly Harbour.",
      "Golden sunset views from the private dock.",
      "Outdoor kitchen and bar for relaxed poolside entertaining.",
      "Generous covered lounge seating beside the pool.",
      "Direct boat access from the private Coco Palms dock.",
      "Al fresco dining beside the pool.",
      "The private swimming pool beneath the Antiguan sun.",
      "Outdoor kitchen overlooking the harbour at sunset.",
    ];
    for (const caption of exteriorCaptions) {
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }

    const localAreaCaptions = [
      "Historic Nelson’s Dockyard, a UNESCO World Heritage Site.",
      "Beachfront relaxation at Salt Plage.",
      "Relaxed beachfront dining at Catherine’s Café.",
      "Contemporary Asian-inspired dining at Rokuni.",
      "Sheer Rocks’ spectacular clifftop dining setting.",
      "Beautifully presented Caribbean flavours at Sheer Rocks.",
      "Miracles restaurant, close to the entrance of Jolly Harbour.",
      "Waterside Italian dining at Al Porto in Jolly Harbour.",
      "Tennis courts at the Jolly Harbour Sports Centre.",
      "Pickleball courts at the Jolly Harbour Sports Centre.",
      "The fully equipped gym at the Jolly Harbour Sports Centre.",
    ];
    for (const caption of localAreaCaptions) {
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }
    const localVideoCaption = "Discover Antigua’s turquoise water and the relaxed pace of Jolly Harbour.";
    const localVideo = screen.getByLabelText(`${localVideoCaption} video`);
    expect(localVideo).toHaveAttribute("src", "/images/gallery/local-area/image12.mp4");
    expect(localVideo).toHaveAttribute("poster", "/images/gallery/local-area/image12-poster.jpg");
    expect(screen.getByText(localVideoCaption)).toBeInTheDocument();

    const collectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(collectionHeadings.map((heading) => heading.textContent)).toEqual(["Interior", "Exterior", "Local Area"]);
  });
});
