import type {NextConfig} from 'next';
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      executionTimeout: 120, // 120 seconds
      bodySizeLimit: '30mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'auirtluswvdhcpmkcdoo.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas from being bundled on the server
    if (isServer) {
        config.externals.push('canvas');
    }
    
    // Copy the pdf.js worker to the public directory
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
            to: path.join(__dirname, 'public/static'),
          },
        ],
      })
    );

    return config
  },
};

export default nextConfig;
