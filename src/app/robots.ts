import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin/", "/api/"] },
    ],
    sitemap: "https://www.cocopalms-antigua.com/sitemap.xml",
  };
}
