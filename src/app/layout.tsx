import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// ── Typefaces: committed variable woff2s in src/fonts, served by next/font.
// next/font/google only self-hosts at RUNTIME — it still fetches from Google
// at BUILD time, and a fonts.gstatic rotation 404 failed CI with nine font
// module errors (#914). These files remove the network from the build
// entirely. Both faces are OFL-licensed; latin subset covers Western-European
// diacritics. Licensed Avenir Next LT Pro takes over automatically if its
// files are added to /public/fonts (see globals.css).
const jakarta = localFont({
  src: [{ path: "../fonts/plus-jakarta-sans-latin-wght.woff2", style: "normal", weight: "200 800" }],
  variable: "--font-jakarta",
  display: "swap",
});

// Marketing display face — warm, confident serif used only by the public
// pages' mk-display classes.
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-latin-wght.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/fraunces-italic-latin-wght.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

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
    <html lang="en" className={`h-full antialiased ${jakarta.variable} ${fraunces.variable}`} style={{ fontFamily: "var(--font-sans)" }}>
      <body className="min-h-full bg-[var(--cs-bg)] text-[var(--cs-text)] selection:bg-[var(--cs-cara-gold-soft)] selection:text-[var(--cs-navy)]">
        <OfflineBanner />
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
