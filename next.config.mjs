/**
 * next.config.mjs – Next.js configuration for static export
 *
 * @author    Jo Zapf <https://jozapf.de>
 * @license   MIT
 * @version   1.0.0
 * @since     2025-12
 * @see       https://github.com/JoZapf/nextjs-static-og-generator
 *
 * @type {import('next').NextConfig}
 */
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
