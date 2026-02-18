'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { StoreInitializer } from "./store-initializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={24 * 60 * 60} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
        <Toaster position="bottom-right" />
        <StoreInitializer />
      </ThemeProvider>
    </SessionProvider>
  );
} 
