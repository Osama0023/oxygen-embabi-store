'use client';

import Image, { ImageProps } from 'next/image';

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
  return <Image src={src} unoptimized={shouldSkipOptimization(src)} {...props} />;
}
