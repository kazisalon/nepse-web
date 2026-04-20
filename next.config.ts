import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://192.168.1.79:3000", "http://192.168.1.79:3001"],
};

export default nextConfig;
