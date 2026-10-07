/** @type {import('next').NextConfig} */

// Backend base URL. Locally this defaults to the dev FastAPI server; in
// production set BACKEND_URL (e.g. in Vercel) to your deployed backend, such as
// https://route53-clone-api.onrender.com
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
