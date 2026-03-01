import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { Providers } from "@/components/providers";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { Toaster } from "react-hot-toast";
import { OrganizationStructuredData } from "@/components/seo/structured-data";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { Analytics } from "@vercel/analytics/react";
import { locales, type Locale } from "@/lib/i18n";
import { getDir } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });
const arabicFont = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.oxgenembabi.com"),
  title: {
    template: "%s | Embabi Store",
    default: "Oxgen Embabi Store - Your One-Stop Shop for All Your Needs",
  },
  description:
    "Discover a wide range of products at Oxgen Embabi Store. From electronics to clothing, we offer quality items at competitive prices with fast delivery.",
  keywords: ["online store", "e-commerce", "electronics", "clothing", "accessories", "Egypt", "shopping"],
  authors: [{ name: "Oxgen Embabi Store", url: "https://embabi-store.com" }],
  creator: "Oxgen Embabi Store",
  publisher: "Oxgen Embabi Store",
  icons: {
    // Served from Cloudinary CDN to reduce Vercel edge requests.
    // Upload public/app-icon.png to Cloudinary folder "embabi-store/icons" as "app-icon"
    icon: process.env.NEXT_PUBLIC_APP_ICON_URL || "/app-icon.png",
    shortcut: process.env.NEXT_PUBLIC_APP_ICON_URL || "/app-icon.png",
    apple: process.env.NEXT_PUBLIC_APP_ICON_URL || "/app-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_EG",
    siteName: "Embabi Store",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@oxgenembabi",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const lang = locale as Locale;
  const dir = getDir(lang);
  const fontClass = lang === "ar" ? arabicFont.className : inter.className;

  return (
    <html lang={locale} dir={dir} className={fontClass} suppressHydrationWarning>
      <body className={`${fontClass} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <Providers locale={lang}>
          <PageViewTracker />
          <ConditionalLayout locale={lang}>{children}</ConditionalLayout>
          <Toaster position="bottom-right" />
        </Providers>
        <OrganizationStructuredData />
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                  if(!window.__fbPageViewFired){window.__fbPageViewFired=1;fbq('track','PageView');}
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        <Analytics />
      </body>
    </html>
  );
}
