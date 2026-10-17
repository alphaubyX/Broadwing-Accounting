import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server (server.js + only the node_modules it needs), so the
  // app can be uploaded to cPanel / shared hosting without building there.
  output: "standalone",
  experimental: {
    serverActions: {
      // Receipts and logos are uploaded through server actions.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
