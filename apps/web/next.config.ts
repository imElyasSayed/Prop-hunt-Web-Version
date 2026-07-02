import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Next doesn't pick a stray parent
  // lockfile (there are multiple lockfiles on this machine).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
