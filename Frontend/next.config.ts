import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the trace root to this project so a stray lockfile in a parent
  // directory cannot widen the file-tracing scope.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Placeholder photography. Swap for your own CDN when real assets land.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
