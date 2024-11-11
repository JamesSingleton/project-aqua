import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const domain = headersList.get("host") as string;

  return [
    {
      url: `https://${domain}`,
      lastModified: new Date(),
    },
  ];
}
