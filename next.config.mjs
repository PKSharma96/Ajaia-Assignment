/**
 * The browser only talks to this Next.js app. Every /api/* request is forwarded to the
 * Express backend, so the session cookie is first-party and no CORS setup is needed.
 */
const API_URL = process.env.API_URL || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
