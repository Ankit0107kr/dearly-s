import path from "node:path";
import type { NextConfig } from "next";

function backendOriginForRewrites() {
  const raw = (process.env.BACKEND_BASE_URL || "http://localhost:5001").trim();
  const withoutApi = raw.replace(/\/api\/v1\/?$/, "");
  return withoutApi.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  // Pin the trace root to this project so a stray lockfile in a parent
  // directory cannot widen the file-tracing scope.
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    const origin = backendOriginForRewrites();
    return [
      {
        source: "/api/v1/:path*",
        destination: `${origin}/api/v1/:path*`,
      },
    ];
  },
  images: {
    // Placeholder photography. Swap for your own CDN when real assets land.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
