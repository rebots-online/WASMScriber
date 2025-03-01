/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // WebAssembly config
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Allow WebAssembly files to be processed
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Web Worker config
    config.module.rules.push({
      test: /\.worker\.(js|ts|tsx)$/,
      use: {
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      },
    });

    // Update fallback for WebAssembly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
  // Required to make worker-loader work with Next.js
  experimental: {
    esmExternals: "loose",
  }
};

export default nextConfig;
