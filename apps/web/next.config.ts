import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const defaultApiUrl = isProd
  ? 'https://neostats-hackathon.onrender.com/api/v1'
  : 'http://localhost:4000/api/v1';
const defaultWsUrl = isProd
  ? 'https://neostats-hackathon.onrender.com'
  : 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forgeline/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || defaultApiUrl,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl,
  },
};

export default nextConfig;
