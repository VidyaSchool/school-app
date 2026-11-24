import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyaschool.com';
  const now = new Date();

  // Core static & marketing pages
  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about-vidyaschool', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/principals-message', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/teachers-and-staff', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/leadership', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/vision-and-mission', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/downloads', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/gallery', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/infrastructure', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/infrastructure-details', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/laboratories', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/library', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/get-involved', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/sponsors', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/torch-bearers', priority: 0.7, changeFrequency: 'monthly' },

    // Student life & co-curriculars
    { path: '/activities', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/clubs', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/sports', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/stem', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/robotics', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/arts-and-music', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/student-life', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/tech-fest', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/events', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/announcements', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/notices', priority: 0.8, changeFrequency: 'daily' },
    { path: '/circulars', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/achievements', priority: 0.7, changeFrequency: 'monthly' },

    // Academics
    { path: '/curriculum', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/subjects', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/syllabus', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/textbooks', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/examinations', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/results', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/academic-calendar', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/fee-structure', priority: 0.9, changeFrequency: 'monthly' },

    // Compliance
    { path: '/mandatory-public-disclosure', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/affiliation', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/annual-report', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/school-management-committee', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pta', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/certificates', priority: 0.8, changeFrequency: 'monthly' },

    // Admissions
    { path: '/admission', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/admission-process', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/eligibility', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faqs', priority: 0.8, changeFrequency: 'monthly' },

    // Developers & Sitemap
    { path: '/developers', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/sitemap', priority: 0.7, changeFrequency: 'weekly' },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Fumadocs documentation routes (all 58 MDX guides, compliance, academics, legal, etc.)
  const docPages = source.getPages();
  const docEntries: MetadataRoute.Sitemap = docPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.8,
  }));

  return [...staticEntries, ...docEntries];
}
