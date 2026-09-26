import type { MetadataRoute } from "next";

const base = "https://www.cocopalms-antigua.com";
const pages = ["", "/the-villa", "/location-and-amenities", "/gallery", "/rates-and-availability", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({ url: `${base}${path}` }));
}
