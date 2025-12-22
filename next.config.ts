import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Configure external packages for serverless functions
  // Required for @sparticuz/chromium to work on Vercel
  serverExternalPackages: ['@sparticuz/chromium'],
  
  // Image optimization settings for Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
