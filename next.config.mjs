/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  eslint: {
    // Lint runs as its own CI step (`npm run lint`) so `next build` stays fast.
    ignoreDuringBuilds: true
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
