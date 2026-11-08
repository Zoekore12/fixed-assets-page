/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ministry-fixed-assets-api.onrender.com/:path*"
      },
    ];
  },
};

export default nextConfig;
