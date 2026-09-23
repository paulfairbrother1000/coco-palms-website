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
    ];
  },
};

export default nextConfig;
