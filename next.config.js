/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
  eslint: {
    // allow build even if there's eslint errors/warnings
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
