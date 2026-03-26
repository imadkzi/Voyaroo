import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/trips/:tripId/countdown",
        destination: "/trips/:tripId",
        permanent: false,
      },
      {
        source: "/trips/:tripId/itinerary",
        destination: "/trips/:tripId?tab=itinerary",
        permanent: false,
      },
      {
        source: "/trips/:tripId/checklist",
        destination: "/trips/:tripId?tab=checklist",
        permanent: false,
      },
      {
        source: "/trips/:tripId/outfits",
        destination: "/trips/:tripId?tab=outfits",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
