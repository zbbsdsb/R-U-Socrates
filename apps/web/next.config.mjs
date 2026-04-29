/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ru-socrates/types"],
  experimental: {
    typedRoutes: false,
  },
  // Enable standalone output for minimal Docker images
  output: "standalone",
};

export default nextConfig;
