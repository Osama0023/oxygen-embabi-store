'use client';

import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import type { ComponentProps } from 'react';

type LocaleLinkProps = ComponentProps<typeof Link> & {
  href: string;
};

/**
 * Link that prefixes href with current locale. Use for in-app navigation.
 * Skips prefixing for external URLs, api, admin, and anchor-only hrefs.
 */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale();

  const prefixedHref = (() => {
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return href;
    }
    if (href.startsWith('/api') || href.startsWith('/admin')) {
      return href;
    }
    if (href.startsWith('#') || href === '') {
      return href;
    }
    if (href.startsWith(`/${locale}`)) {
      return href; // Already prefixed
    }
    return `/${locale}${href.startsWith('/') ? href : `/${href}`}`;
  })();

  return <Link href={prefixedHref} {...props} />;
}
