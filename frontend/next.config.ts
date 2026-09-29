import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@om/db"],
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
};

export default nextConfig;
