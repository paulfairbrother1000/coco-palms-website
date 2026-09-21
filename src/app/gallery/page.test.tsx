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
    expect(screen.getByRole("img", { name: "Interior 1" })).toBeInTheDocument();

    const collectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(collectionHeadings.map((heading) => heading.textContent)).toEqual(["Interior", "Exterior", "Local Area"]);
  });
});
