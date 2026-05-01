/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.enamorimpex.com",
      },
    ],
  },
};

module.exports = nextConfig;
