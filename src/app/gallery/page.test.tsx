import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GalleryPage from "./page";

describe("gallery page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders the local gallery when public Supabase configuration is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    render(await GalleryPage());

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText("Coco Palms and Antigua")).not.toBeInTheDocument();
    expect(screen.getAllByText("Gallery collection")[0]).toBeInTheDocument();
    expect(screen.queryByText(/Each collection has room for 12 photographs/i)).not.toBeInTheDocument();
    const interiorCaptions = [
      "Indoor dining for 8 in the Great Room.",
      "Spacious open-plan Lounge with comfortable seating and large-screen TV.",
      "Fully equipped and modern Kitchen.",
      "Ocean-facing Principal Bedroom suite with Emperor bed, dressing room, 55-inch TV, AC, ceiling fan, safe and ensuite Shower Room with twin basins, WC and walk-in rain shower.",
      "Primary Bedroom suite with Eastern King bed, AC, ceiling fan, TV, safe and ensuite Bathroom with twin basins, freestanding bathtub and walk-in rain shower.",
      "3rd Bedroom with 2 king-size beds, AC, ceiling fan, TV and safe.",
      "4th Bedroom with Super King-size bed, AC, ceiling fan, TV and safe.",
      "House Bathroom with twin basins, WC and walk-in rain shower.",
      "Laundry Room with washer and dryer.",
      "Open-plan Kitchen and lounging space beneath the vaulted ceiling.",
      "Built-in bean-to-cup coffee machine for fresh coffee at any time.",
      "Relax in the Primary Ensuite’s deep soaking bath.",
    ];

    for (const caption of interiorCaptions) {
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText(/Interior \d+ image placeholder/)).not.toBeInTheDocument();

    const exteriorCaptions = [
      "Sundowner spaces. Perfect for sharing.",
      "Covered terrace with sunset views across the harbour.",
      "Sunset dining on the covered waterside terrace.",
      "Poolside mornings with uninterrupted harbour views.",
      "Exploring Jolly Harbour and the beaches beyond.",
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
      "Beachfront relaxation at Salt Plage on Dickenson Bay.",
      "Historic Nelson’s Dockyard, a UNESCO World Heritage Site.",
      "Relaxed beachfront dining at Catherine’s Café.",
      "Contemporary Asian-inspired dining at Rokuni.",
      "Sheer Rocks’ spectacular clifftop dining setting.",
      "Beautifully presented Caribbean flavours at Sheer Rocks.",
      "Miracles restaurant, close to the entrance of Jolly Harbour.",
      "Waterside Italian dining at Al Porto in Jolly Harbour.",
      "Tennis courts at the Jolly Harbour Sports Centre.",
      "Pickleball courts at the Jolly Harbour Sports Centre.",
      "The fully equipped gym at the Jolly Harbour Sports Centre.",
      "The magnificent Jolly Beach.",
    ];
    for (const caption of localAreaCaptions.slice(0, -1)) {
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }
    const renderedLocalAreaCaptions = Array.from(document.querySelectorAll("#local-area figcaption"))
      .map((caption) => caption.textContent);
    expect(renderedLocalAreaCaptions).toEqual(localAreaCaptions);

    const localVideoCaption = localAreaCaptions.at(-1)!;
    const localVideo = screen.getByLabelText(`${localVideoCaption} video`);
    expect(localVideo).toHaveAttribute("src", "/images/gallery/local-area/image12.mp4");
    expect(localVideo).toHaveAttribute("poster", "/images/gallery/local-area/image12-poster.jpg");
    expect(screen.getByText(localVideoCaption)).toBeInTheDocument();

    const collectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(collectionHeadings.map((heading) => heading.textContent)).toEqual(["Interior", "Exterior", "Local Area"]);
    expect(screen.getByText("Contemporary spaces to relax, recharge and wake up in paradise.")).toBeInTheDocument();
    expect(screen.queryByText(/Master Bedroom/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("img").every((image) => image.classList.contains("gallery-image-original"))).toBe(true);
  });
});
