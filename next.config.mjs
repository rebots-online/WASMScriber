/**
 * @file next.config.mjs
 * @description Next.js configuration with WebAssembly and Web Worker support
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WebAssembly
  webpack: (config, { isServer, dev }) => {
    // WebAssembly config
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    };

    // Web Worker config
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
          inline: 'no-fallback'
        }
      }
    });

    // WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async'
    });

    // Fix for worker-loader
    if (!isServer) {
      config.output.globalObject = 'self';
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 100000
        }
      };
    }

    return config;
  },

  // Enable strict mode
  reactStrictMode: true,

  // Configure headers for WASM and Workers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          }
        ]
      }
    ];
  },

  // Configure output export
  output: 'standalone',

  // Page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Disable image optimization for WASM files
  images: {
    unoptimized: true
  },

  // Environment configuration
  env: {
    NEXT_PUBLIC_WASM_PATH: '/whisper.wasm'
  }
};

export default nextConfig;
