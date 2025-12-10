/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  reactStrictMode: true,
  
  // Disable Turbopack to avoid workspace root detection issues
  // when this project is nested inside another Next.js project
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
