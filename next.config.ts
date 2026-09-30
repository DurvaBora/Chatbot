import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure the persona files ship with the serverless function on deploy.
  outputFileTracingIncludes: {
    "/api/chat": ["./persona/**/*"],
  },
};

export default nextConfig;
