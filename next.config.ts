import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Linting runs in CI / locally via `npm run lint`; don't block deploys.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Google account avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
