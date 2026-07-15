import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ABU Cooperative",
    short_name: "ABU Coop",
    description: "Cooperative savings and loan management for ABU students.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8faf8",
    theme_color: "#0d6436",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
