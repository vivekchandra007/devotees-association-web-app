import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**', // YouTube thumbnails are typically under /vi/<videoId>/...
      },
    ],
  },
};

export default nextConfig;
