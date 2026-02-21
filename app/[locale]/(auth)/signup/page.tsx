import { Suspense } from "react";
import { StoreImage } from "@/components/ui/store-image";
import { SignUpForm } from "@/components/auth/signup-form";
import { translations } from "@/lib/translations";
import { isValidLocale, type Locale } from "@/lib/i18n";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isValidLocale(locale) ? locale : "en") as Locale;
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[1000px] mx-4 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative bg-orange-50 min-h-[300px] lg:min-h-[600px]">
            <StoreImage
              src="/logo-onepiece.png"
              alt="Sign Up Banner"
              fill
              className="object-contain p-8"
              priority
            />
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
                <p className="mt-2 text-sm text-gray-600">{t('auth.joinUs')}</p>
              </div>
              <Suspense fallback={<div className="h-96 animate-pulse rounded bg-gray-100" />}>
                <SignUpForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 