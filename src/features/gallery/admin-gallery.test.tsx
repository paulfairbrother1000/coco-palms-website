import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin gallery module", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("can be imported during a build without public Supabase configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(import("./admin-gallery")).resolves.toMatchObject({ AdminGallery: expect.any(Function) });
  });
});
