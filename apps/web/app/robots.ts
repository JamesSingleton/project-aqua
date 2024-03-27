import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const headersList = headers();
  const domain = headersList.get("host") as string;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `https://${domain}/sitemap.xml`,
  };
}
