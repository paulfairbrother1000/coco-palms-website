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

    expect(screen.getByRole("img", { name: "Nelson’s Dockyard" })).toBeInTheDocument();
    const localVideo = screen.getByLabelText("Antigua and Jolly Harbour video");
    expect(localVideo).toHaveAttribute("src", "/images/gallery/local-area/image12.mp4");
    expect(localVideo).toHaveAttribute("poster", "/images/gallery/local-area/image12-poster.jpg");

    const collectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(collectionHeadings.map((heading) => heading.textContent)).toEqual(["Interior", "Exterior", "Local Area"]);
  });
});
