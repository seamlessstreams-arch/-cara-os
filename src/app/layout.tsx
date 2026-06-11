import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// ── Cara OS uses Avenir Next LT Pro (declared in globals.css via @font-face)
// with a graceful fallback chain. No Google Fonts dependency.
// This gives Cara OS a distinctive, warm, professional identity
// that doesn't look like a generic template.

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0f1e36", // Cara navy
};

export const metadata: Metadata = {
  title: `${BRAND.productName} | The Care Intelligence OS for children's homes`,
  description: BRAND.description,
  applicationName: BRAND.productName,
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
    title: BRAND.shortName,
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
        <OfflineBanner />
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
