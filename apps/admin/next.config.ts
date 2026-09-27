import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import { env } from "./env";

// Force env validation at build time (throws if required vars are missing).
void env;

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.166"],
  ...(process.env.SCREENSHOT_DIST === "1"
    ? { distDir: ".next-screenshots" }
    : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
  transpilePackages: [
    "@lane4hq/ui",
    "@lane4hq/auth",
    "@lane4hq/db",
    "@lane4hq/emails",
    "@lane4hq/billing",
    "@lane4hq/swim-core",
    "@lane4hq/swim-formats",
    "@lane4hq/usa-swimming",
    "@lane4hq/reports",
    "@lane4hq/storage",
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

export default withBotId(nextConfig);
