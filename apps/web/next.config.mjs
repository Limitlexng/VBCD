/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@berry-x/types'],
  images: {
    domains: ['localhost', 'api.berryx.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_APP_NAME: 'Berry X',
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },
  async redirects() {
    return [{ source: '/', destination: '/home', permanent: false }];
  },
};

export default nextConfig;
