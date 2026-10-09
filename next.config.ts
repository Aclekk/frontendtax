import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Note: removed the /api/gw rewrite so the in-app proxy at
  // src/app/api/gw/[...path]/route.ts can handle gateway requests in development.
};

export default nextConfig;
