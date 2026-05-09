/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ru-socrates/types"],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
