import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
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
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
      {
        source: "/login",
        destination: `${backendUrl}/api/v1/auth/login`,
      },
      {
        source: "/register",
        destination: `${backendUrl}/api/v1/auth/register`,
      },
      {
        source: "/products/:path*",
        destination: `${backendUrl}/api/v1/products/:path*`,
      }
    ];
  },
};

export default nextConfig;
