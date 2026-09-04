/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.166"],
  transpilePackages: [
    "@project-aqua/ui",
    "@project-aqua/auth",
    "@project-aqua/db",
    "@project-aqua/emails",
    "@project-aqua/billing",
    "@project-aqua/swim-core",
    "@project-aqua/swim-formats",
    "@project-aqua/usa-swimming",
    "@project-aqua/reports",
  ],
  serverExternalPackages: [
    "postgres",
    "xlsx",
    "fflate",
    "@polar-sh/sdk",
    "@react-pdf/renderer",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
