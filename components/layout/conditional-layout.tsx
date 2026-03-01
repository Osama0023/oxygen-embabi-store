'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import type { Locale } from '@/lib/i18n';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  locale: Locale;
}

export function ConditionalLayout({ children, locale }: ConditionalLayoutProps) {
  const pathname = usePathname() ?? '';
  const isMaintenancePage = pathname.includes('/maintenance');

  if (isMaintenancePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar locale={locale} />
      <main className="flex-grow">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
