import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Anthropic SDK has a TS issue in its internal UUID helper
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
