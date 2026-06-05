import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// ── Cornerstone uses Avenir Next LT Pro (declared in globals.css via @font-face)
// with a graceful fallback chain. No Google Fonts dependency.
// This gives Cornerstone a distinctive, warm, professional identity
// that doesn't look like a generic template.

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0f1e36", // Cornerstone navy
};

export const metadata: Metadata = {
  title: "Cornerstone | Care OS for Children's Homes",
  description:
    "The operating system for children's residential care. Safeguarding, compliance, intelligence, and oversight — calm, clear, and always Ofsted-ready.",
  applicationName: "Cornerstone",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cornerstone",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" style={{ fontFamily: "var(--font-sans)" }}>
      <body className="min-h-full bg-[var(--cs-bg)] text-[var(--cs-text)] selection:bg-[var(--cs-aria-gold-soft)] selection:text-[var(--cs-navy)]">
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
