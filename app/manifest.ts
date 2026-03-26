import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voyaroo",
    short_name: "Voyaroo",
    description:
      "Trip hub: countdowns, itinerary, packing lists, and outfit planning.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fafafa",
    theme_color: "#ff385c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
