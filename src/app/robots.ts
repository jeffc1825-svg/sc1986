import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [routes.admin.root, "/api/", `${routes.quote}/success`],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
