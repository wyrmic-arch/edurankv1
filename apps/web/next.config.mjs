/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@edurank/shared"],
  images: { unoptimized: true },
};

export default nextConfig;
