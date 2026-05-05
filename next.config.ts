import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Source maps disabled in prod — reduces payload and avoids leaking source
  productionBrowserSourceMaps: false,
};

export default nextConfig;
