import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Receipts and logos are uploaded through server actions.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
