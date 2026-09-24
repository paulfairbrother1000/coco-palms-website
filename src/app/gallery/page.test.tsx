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
      "Flexible bedroom space for family stays.",
      "Calm, comfortable and made for unwinding.",
      "Restful nights beneath the vaulted ceiling.",
      "A peaceful bedroom retreat.",
      "The Great Room dressed for Christmas.",
      "Poolside dining, reflected indoors.",
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
      "Private boat dock",
      "Al fresco dining beside the pool.",
      "Private swimming pool",
      "Outdoor kitchen overlooking the harbour at sunset.",
      "Poolside dining with a harbour view.",
      "Island drinks with a harbour view.",
      "Ready for adventures on the water.",
      "Coco Palms from the water.",
      "The pool glowing after dark.",
      "Evenings made for poolside living.",
      "Sunset colours across the terrace.",
      "Waterside lounging after sunset.",
      "Coco Palms beneath an Antiguan sunset.",
      "Sunset over Jolly Harbour.",
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
      "Waterside Mediterranean dining at Al Porto in Jolly Harbour.",
      "Floodlit tennis courts at Jolly Harbour Sports Village.",
      "Floodlit pickleball courts at Jolly Harbour Sports Village.",
      "Fully equipped, air-conditioned, 6,000 sq. ft. gym at Jolly Harbour Sports Village.",
      "Nearby Jolly Beach",
      "White sands and endless Caribbean blue.",
      "Barefoot days on Antigua’s beaches.",
      "The shoreline at golden hour.",
      "Sunset, Antigua style.",
    ];
    for (const [index, caption] of localAreaCaptions.entries()) {
      if (index === 11) continue;
      expect(screen.getByRole("img", { name: caption })).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    }
    const renderedLocalAreaCaptions = Array.from(document.querySelectorAll("#local-area figcaption"))
      .map((caption) => caption.textContent);
    expect(renderedLocalAreaCaptions).toEqual([1, 2, 13, 3, 4, 5, 14, 6, 7, 8, 15, 9, 10, 11, 16, 12]
      .map((position) => localAreaCaptions[position - 1]));

    const localVideoCaption = localAreaCaptions[11];
    const localVideo = screen.getByLabelText(`${localVideoCaption} video`);
    expect(localVideo).toHaveAttribute("src", "/images/gallery/local-area/image12.mp4");
    expect(localVideo).toHaveAttribute("poster", "/images/gallery/local-area/image12-poster.jpg");
    expect(screen.getByText(localVideoCaption)).toBeInTheDocument();

    const collectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(collectionHeadings.map((heading) => heading.textContent)).toEqual(["Interior", "Exterior", "Local Area"]);
    expect(screen.getByText("Contemporary spaces to relax, recharge and wake up in paradise.")).toBeInTheDocument();
    expect(screen.getByText("Boat dock, private pool and waterside terraces, built for outdoor living.")).toBeInTheDocument();
    expect(screen.getByText("Beyond the villa, discover Antigua’s beaches, historic harbours and island vibe.")).toBeInTheDocument();
    expect(screen.queryByText(/Master Bedroom/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("img").every((image) => image.classList.contains("gallery-image-original"))).toBe(true);
    expect(screen.getByRole("img", { name: exteriorCaptions[0] })).toHaveClass("gallery-image-exterior-1");
    expect(screen.getByRole("img", { name: exteriorCaptions[1] })).toHaveClass("gallery-image-exterior-2");
    expect(document.querySelectorAll("#interior figure")).toHaveLength(18);
    expect(document.querySelectorAll("#exterior figure")).toHaveLength(22);
    expect(document.querySelectorAll("#local-area figure")).toHaveLength(16);
    expect(Array.from(document.querySelectorAll("#exterior figcaption")).slice(0, 6).map((caption) => caption.textContent))
      .toEqual([
        exteriorCaptions[0],
        exteriorCaptions[12],
        exteriorCaptions[1],
        exteriorCaptions[13],
        exteriorCaptions[2],
        exteriorCaptions[14],
      ]);
  });
});
