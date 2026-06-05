import type { MetadataRoute } from "next";

// Web App Manifest — makes Cornerstone installable to the home screen as a
// standalone, full-screen app (Add to Home Screen / Install). Next.js serves this
// at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cornerstone — Care OS for Children's Homes",
    short_name: "Cornerstone",
    description:
      "Secure operations for children's residential care — sign-in, comms, safeguarding, staffing and oversight.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f8fa",
    theme_color: "#0f1e36",
    categories: ["business", "productivity", "medical"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
