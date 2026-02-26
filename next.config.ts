import type { NextConfig } from "next";

const isWebpackDev = process.env.NEXT_DEV_ENGINE === "webpack";
const isTurboDev = process.env.NEXT_DEV_ENGINE === "turbo";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep separate caches for each dev engine and keep production build in default .next.
  // This avoids stale chunk/runtime collisions when switching webpack <-> turbopack.
  ...(isWebpackDev ? { distDir: ".next-dev-webpack" } : {}),
  ...(isTurboDev ? { distDir: ".next-dev-turbo" } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
