import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Source maps disabled in prod — reduces payload and avoids leaking source
  productionBrowserSourceMaps: false,

  // Deep-link support for the client-routed public sub-pages. The app is a
  // single `/` route that swaps views from the flow registry (see
  // src/content/flow.ts → SCREENS[].path + viewForPath). Without these
  // rewrites, cold-loading /privacy or /terms 404s because no server route
  // exists. Each rewrite serves the `/` page, whose mount effect resolves the
  // path back to its screen. Keep in sync with the `path` fields in SCREENS.
  async rewrites() {
    return [
      { source: "/privacy", destination: "/" },
      { source: "/terms", destination: "/" },
    ];
  },

  /**
   * The old brand domain is aliased to this same project, so it served a byte
   * -identical copy of the app. Google's verdict on firstday.life was "Duplicate
   * without user-selected canonical" — it had picked the .xyz as the original and
   * left the real domain unindexed (0 indexed pages as of 2026-08-11). A 301 is
   * what consolidates them; the canonical tag in layout.tsx is the belt to this
   * pair of braces.
   *
   * Keep the alias attached rather than deleting it: old links, and the OAuth
   * client's authorized-domain list, still point at it.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?firstdayoftherestofyourlife\\.xyz" }],
        destination: "https://firstday.life/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
