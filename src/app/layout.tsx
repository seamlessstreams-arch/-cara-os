import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// ── Typeface: Plus Jakarta Sans, self-hosted at build time by next/font
// (no runtime Google requests — files are baked into the deployment).
// Licensed Avenir Next LT Pro takes over automatically if its files are
// added to /public/fonts (see globals.css).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
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
    <html lang="en" className={`h-full antialiased ${jakarta.variable}`} style={{ fontFamily: "var(--font-sans)" }}>
      <body className="min-h-full bg-[var(--cs-bg)] text-[var(--cs-text)] selection:bg-[var(--cs-aria-gold-soft)] selection:text-[var(--cs-navy)]">
        <OfflineBanner />
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
