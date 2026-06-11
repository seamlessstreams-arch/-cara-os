import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Web App Manifest — makes Cara OS installable to the home screen as a
// standalone, full-screen app (Add to Home Screen / Install). Next.js serves this
// at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${BRAND.productName} — Care Intelligence OS for Children's Homes`,
    short_name: BRAND.shortName,
    description:
      "Secure operations for children's residential care — sign-in, comms, safeguarding, staffing and oversight.",
    start_url: "/dashboard",
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
    // Long-press / right-click the installed app icon → jump straight to the
    // moments that matter on shift.
    shortcuts: [
      {
        name: "Shift Briefing",
        short_name: "Shift",
        description: "Who's on, what's due this shift, and overnight events",
        url: "/shift-briefing",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Incident Mode",
        short_name: "Incident",
        description: "Live support while an incident is happening",
        url: "/cara/incident-mode",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Priority Briefing",
        short_name: "Priorities",
        description: "What needs attention, ranked across every engine",
        url: "/priority-briefing",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My Day",
        short_name: "My Day",
        description: "Your tasks, handover and plan for today",
        url: "/dashboard/my-day",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    // Richer install sheet on Android / desktop (real screens, demo data).
    screenshots: [
      { src: "/tour/mobile-dashboard.jpg", sizes: "780x1688", type: "image/jpeg", form_factor: "narrow", label: "Command Centre on mobile" },
      { src: "/tour/dashboard.jpg", sizes: "1760x1100", type: "image/jpeg", form_factor: "wide", label: "Command Centre" },
      { src: "/tour/incident-mode.jpg", sizes: "1760x1100", type: "image/jpeg", form_factor: "wide", label: "Cara Incident Mode" },
    ],
  };
}
