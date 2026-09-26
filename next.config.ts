import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/rates",
        destination: "/rates-and-availability",
        permanent: true,
      },
      { source: "/ratesoldpage", destination: "/rates-and-availability", permanent: true },
      { source: "/amenities", destination: "/location-and-amenities", permanent: true },
      { source: "/Contact-us", destination: "/contact", permanent: true },
      { source: "/payments", destination: "/rates-and-availability", permanent: true },
    ];
  },
};

export default nextConfig;
