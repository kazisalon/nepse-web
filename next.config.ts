import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/api/nepse",
        destination: "http://127.0.0.1:8001/api/nepse",
      },
    ];
  },
};

export default nextConfig;
