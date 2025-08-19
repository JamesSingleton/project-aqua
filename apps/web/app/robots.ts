import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const domain = headersList.get("host") as string;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/team/", "/api/"],
    },
    sitemap: `https://${domain}/sitemap.xml`,
  };
}
