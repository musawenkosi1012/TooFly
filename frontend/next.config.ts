import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // This proxies /api and /v1 requests to your backend
    // You should set the NEXT_PUBLIC_API_URL environment variable in Vercel 
    // to your backend URL (e.g., https://too-fly-core.vercel.app)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      // Some calls might omit the /api prefix in the code
      {
        source: "/login",
        destination: `${backendUrl}/api/login`,
      },
      {
        source: "/register",
        destination: `${backendUrl}/api/register`,
      }
    ];
  },
};

export default nextConfig;
