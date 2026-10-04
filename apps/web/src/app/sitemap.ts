import type { MetadataRoute } from "next";
import { fetchStudyIndex } from "@/lib/study";

export const runtime = "edge";

const SITE = "https://edurank.co.za";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: Array<[string, number]> = [
    ["/", 1],
    ["/study", 0.9],
    ["/about", 0.6],
    ["/terms", 0.4],
    ["/privacy", 0.4],
    ["/cookies", 0.4],
    ["/guidelines", 0.4],
    ["/copyright", 0.4],
    ["/accessibility", 0.4],
    ["/security", 0.3],
  ];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map(([path, priority]) => ({
    url: `${SITE}${path}`,
    changeFrequency: "weekly",
    priority,
  }));

  const items = await fetchStudyIndex();
  const hubs = new Map<string, { grade: number; subjectId: string }>();
  const notePages: MetadataRoute.Sitemap = items.map((it) => {
    hubs.set(`${it.grade}/${it.subjectId}`, { grade: it.grade, subjectId: it.subjectId });
    return {
      url: `${SITE}/study/${it.grade}/${it.subjectId}/${it.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    };
  });
  const hubPages: MetadataRoute.Sitemap = [...hubs.values()].map((h) => ({
    url: `${SITE}/study/${h.grade}/${h.subjectId}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...hubPages, ...notePages];
}
