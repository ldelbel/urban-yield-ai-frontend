Read CLAUDE.md before starting.

Fix frontend/next.config.ts for production deployment on
Cloudflare Pages.

The current rewrite points to localhost:8000 which only works
locally. In production it must point to the deployed backend URL.

Replace the next.config.ts with:

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
