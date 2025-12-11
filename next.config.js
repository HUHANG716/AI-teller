/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude winston and its dependencies from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'readable-stream': false,
        'string_decoder': false,
      };
      
      // Completely exclude winston from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        winston: 'commonjs winston',
      });
    }
    return config;
  },
}

module.exports = nextConfig

