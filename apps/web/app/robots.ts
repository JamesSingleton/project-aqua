import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "projectaqua.com";
  const protocol = host.includes("localhost") ? "http" : "https";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${protocol}://${host}/sitemap.xml`,
  };
}
