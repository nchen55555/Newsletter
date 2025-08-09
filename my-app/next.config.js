/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig
