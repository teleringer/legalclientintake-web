import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Legal Client Intake",
    short_name: "LCI",
    description: "AI-powered legal client intake system for law firms",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1f33",
    theme_color: "#0b1f33",
    icons: [
      {
        src: "/lci-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/lci-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}