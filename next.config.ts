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
};

export default nextConfig;
