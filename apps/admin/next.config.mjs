/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@project-aqua/ui",
    "@project-aqua/auth",
    "@project-aqua/db",
    "@project-aqua/emails",
    "@project-aqua/billing",
    "@project-aqua/swim-core",
    "@project-aqua/swim-formats",
    "@project-aqua/usa-swimming",
  ],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
