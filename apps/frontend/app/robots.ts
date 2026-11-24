import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyaschool.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/student/', '/teacher/', '/accounts/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
