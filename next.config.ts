import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native sqlite driver must stay external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // The parent folder has its own package-lock.json; pin the root here.
  turbopack: { root: __dirname },
};

export default nextConfig;
