/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@berry-x/types'],
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }];
  },
};
export default nextConfig;
