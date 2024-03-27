import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const headersList = headers();
  const domain = headersList.get("host") as string;

  return [
    {
      url: `https://${domain}`,
      lastModified: new Date(),
    },
  ];
}
