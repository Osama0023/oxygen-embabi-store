'use client';

import Image, { ImageProps } from 'next/image';

function optimizeCloudinaryUrl(src: ImageProps['src']): ImageProps['src'] {
  if (typeof src !== 'string') return src;
  const s = src.trim();
  if (!s.includes('res.cloudinary.com') || !s.includes('/image/upload/')) return src;
  if (s.includes('/image/upload/f_auto,q_auto/') || s.includes('/image/upload/q_auto,f_auto/')) return src;
  return s.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}

function shouldSkipOptimization(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  // External URLs (Cloudinary, CDNs) - load directly
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return true;
  // Same-origin paths (/images/..., /api/...) - avoid Image Optimization API
  if (s.startsWith('/')) return true;
  return false;
}

/**
 * Wrapper around next/image that bypasses Vercel Image Optimization for external URLs
 * (e.g. Cloudinary) and same-origin paths. Images load directly from source, reducing Edge Requests.
 */
export function StoreImage({ src, ...props }: ImageProps) {
  const optimizedSrc = optimizeCloudinaryUrl(src);
  return <Image src={optimizedSrc} unoptimized={shouldSkipOptimization(optimizedSrc)} {...props} />;
}
