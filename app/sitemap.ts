import { MetadataRoute } from 'next';
import { prisma } from "@/lib/prisma";
import { locales } from '@/lib/i18n';

/**
 * Generate a sitemap for the application with locale variants
 * Served at /sitemap.xml with hreflang support for /en and /ar
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oxgenembabi.com';

  const staticRoutes = [
    '',
    '/products',
    '/categories',
    '/most-selling',
    '/deals',
    '/contact',
    '/branches',
    '/reviews',
    '/login',
    '/signup',
  ];

  // Generate static pages for each locale
  const staticPages: MetadataRoute.Sitemap = [];
  for (const route of staticRoutes) {
    for (const locale of locales) {
      const path = route ? `/${locale}${route}` : `/${locale}`;
      staticPages.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
      });
    }
  }

  let productUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];

  try {
    const products = await prisma.product.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    for (const product of products) {
      for (const locale of locales) {
        productUrls.push({
          url: `${baseUrl}/${locale}/products/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        });
      }
    }

    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });

    for (const category of categories) {
      for (const locale of locales) {
        categoryUrls.push({
          url: `${baseUrl}/${locale}/categories/${category.slug}`,
          lastModified: category.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.warn('Sitemap: Could not fetch products/categories (e.g. DB unavailable during build)');
  }

  return [...staticPages, ...productUrls, ...categoryUrls];
}
