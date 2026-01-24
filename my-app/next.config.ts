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
    domains: ['cdn.sanity.io', 'media.licdn.com'],
  },
  env: {
    NEXT_DISABLE_SYNC_DYNAMIC_APIS_WARNING: 'true',
  },
};

export default nextConfig;
