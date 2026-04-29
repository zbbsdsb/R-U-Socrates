/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ru-socrates/types"],
  experimental: {
    typedRoutes: false,
  },
  // Static export for Electron desktop packaging
  output: "export",
  images: {
    unoptimized: true, // required for static export
  },
};

export default nextConfig;
