import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// Cấu hình PWA
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// Cấu hình Next.js
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);