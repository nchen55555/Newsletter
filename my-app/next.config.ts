import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ubompjslcfgbkidmfuym.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', // public buckets
      },
    ],
    domains: ['cdn.sanity.io'],
  },
};

export default nextConfig;
