/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'portfoliostorage2024.blob.core.windows.net'], // Azure Storage domain
  },
  typescript: {
    ignoreBuildErrors: false, // Re-enable TypeScript error checking during build
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    turbo: {
      rules: {
        // Add any specific Turbopack rules if needed
      }
    }
  },
  // Add proper module resolution
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      net: false,
      dns: false,
      tls: false,
    };
    return config;
  },
}

export default nextConfig;
