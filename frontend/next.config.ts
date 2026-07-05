import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      root: path.resolve('..'),
    },
  }),
};

export default nextConfig;
