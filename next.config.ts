import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Parent folder also has a package-lock.json; pin root so CSS/app resolve correctly
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "chart.googleapis.com",
        pathname: "/chart/**",
      },
    ],
  },
};

export default nextConfig;
