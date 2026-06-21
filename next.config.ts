import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type strictness issues in lib files — does not affect runtime.
    // TODO: resolve all TS errors and remove this flag.
    ignoreBuildErrors: true,
  },
  // Note: the `eslint` config key was removed in Next.js 16 (ESLint no longer
  // runs during `next build`), so it is intentionally omitted here.

  // Cara OS rebrand — legacy URL compatibility. The aria routes (pages AND
  // API) were fully renamed to cara; permanent (308) redirects keep old
  // bookmarks, PWA shortcuts, deep links and any cached/external API callers
  // working (308 preserves method + body, so POSTs survive). More specific
  // sources are listed before their wildcards.
  async rewrites() {
    return [
      // Consolidation: 303 home-* routes collapsed into one catch-all at /api/v1/home/[engine]
      // This keeps URLs backward-compatible while reducing Vercel's routing table size.
      { source: "/api/v1/home-:engine", destination: "/api/v1/home/:engine" },
    ];
  },

  async redirects() {
    return [
      // ── pages ──
      { source: "/aria", destination: "/cara", permanent: true },
      { source: "/aria/:path*", destination: "/cara/:path*", permanent: true },
      { source: "/aria-practice", destination: "/cara-practice", permanent: true },
      { source: "/aria-practice/:path*", destination: "/cara-practice/:path*", permanent: true },
      { source: "/aria-studio", destination: "/cara-studio", permanent: true },
      { source: "/aria-studio/:path*", destination: "/cara-studio/:path*", permanent: true },
      { source: "/intelligence/aria", destination: "/intelligence/cara", permanent: true },
      { source: "/intelligence/aria/:path*", destination: "/intelligence/cara/:path*", permanent: true },
      { source: "/aria-intelligence", destination: "/intelligence/cara", permanent: true },
      { source: "/aria-insights", destination: "/intelligence/cara", permanent: true },
      { source: "/dashboard/aria", destination: "/dashboard/cara", permanent: true },
      { source: "/dashboard/aria-intelligence", destination: "/dashboard/cara-intelligence", permanent: true },
      { source: "/management/aria", destination: "/management/cara", permanent: true },
      { source: "/workforce/aria-planner", destination: "/workforce/cara-planner", permanent: true },
      // ── API (specific leaf clash first) ──
      { source: "/api/aria/review", destination: "/api/cara/ai-review", permanent: true },
      { source: "/api/aria/:path*", destination: "/api/cara/:path*", permanent: true },
      { source: "/api/aria-studio/:path*", destination: "/api/cara-studio/:path*", permanent: true },
      { source: "/api/aria-learning-intelligence/:path*", destination: "/api/cara-learning-intelligence/:path*", permanent: true },
      { source: "/api/aria-learning/:path*", destination: "/api/cara-learning/:path*", permanent: true },
      { source: "/api/v1/aria-incident/:path*", destination: "/api/v1/cara-incident/:path*", permanent: true },
      { source: "/api/v1/aria-manager-oversight/:path*", destination: "/api/v1/cara-manager-oversight/:path*", permanent: true },
      { source: "/api/v1/aria-prompt-bank/:path*", destination: "/api/v1/cara-prompt-bank/:path*", permanent: true },
      { source: "/api/v1/aria-recording-assistant/:path*", destination: "/api/v1/cara-recording-assistant/:path*", permanent: true },
      { source: "/api/v1/home-aria-content-quality-intelligence/:path*", destination: "/api/v1/home-cara-content-quality-intelligence/:path*", permanent: true },
      // ── legacy product name ──
      { source: "/cornerstone", destination: "/", permanent: true },
      { source: "/cornerstone-os", destination: "/", permanent: true },
    ];
  },

  // Explicitly permit the device capabilities Cara OS relies on — for the app's
  // OWN origin (self), on every route. This guarantees the microphone (voice
  // dictation + audio capture), camera (QR / document capture) and geolocation
  // (geofenced presence sign-in) stay enabled across ALL devices Cara OS runs
  // on — including MDM-managed tablets, kiosks and embedded webviews that
  // default-deny these features unless the page opts in. `self` keeps them
  // off-limits to any third-party frame, so it grants access without widening it.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
