import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function imageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return imageFiles(filePath);
    return /\.(?:jpe?g|png)$/i.test(entry.name) ? [filePath] : [];
  });
}

describe("published image assets", () => {
  it("keeps every image safely below the repository transfer limit", () => {
    const oversized = imageFiles(path.join(process.cwd(), "public", "images"))
      .filter((filePath) => statSync(filePath).size > 700_000)
      .map((filePath) => path.relative(process.cwd(), filePath));

    expect(oversized).toEqual([]);
  });
});
