'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { StoreInitializer } from "./store-initializer";
import { LocaleProvider } from "./locale-provider";
import type { Locale } from "@/lib/i18n";

interface ProvidersProps {
  children: React.ReactNode;
  locale?: Locale;
}

export function Providers({ children, locale = 'en' }: ProvidersProps) {
  return (
    <LocaleProvider locale={locale}>
      <SessionProvider refetchInterval={24 * 60 * 60} refetchOnWindowFocus={false}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="bottom-right" />
          <StoreInitializer />
        </ThemeProvider>
      </SessionProvider>
    </LocaleProvider>
  );
} 
