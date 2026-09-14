import type { MetadataRoute } from "next";

/** Coach SaaS — keep crawlers off the entire admin host. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
