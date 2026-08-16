import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  basePath: "/PAG",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    webpackBuildWorker: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
