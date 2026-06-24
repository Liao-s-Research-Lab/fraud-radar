/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        allowedOrigins: ["localhost:5173", "localhost:8081"]
      }
    }
  }
  
  export default nextConfig;
  