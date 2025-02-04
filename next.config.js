/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com'], // Add any image domains you're using
  },
  typescript: {
    ignoreBuildErrors: false, // Re-enable TypeScript error checking during build
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  // Add proper module resolution
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig
