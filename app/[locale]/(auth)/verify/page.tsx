import { StoreImage } from "@/components/ui/store-image";
import { VerificationForm } from "@/components/auth/verification-form";
import { redirect } from "next/navigation";
import { translations } from '@/lib/translations';
import { isValidLocale, type Locale } from '@/lib/i18n';

interface VerifyPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { locale } = await params;
  const resolved = await searchParams;
  const email = resolved.email as string;
  const returnUrl = (resolved.returnUrl as string) || `/${locale}`;
  const fromCart = resolved.fromCart === 'true';

  // If no email is provided, redirect to signup
  if (!email) {
    redirect(`/${locale}/signup`);
  }

  const lang = (isValidLocale(locale) ? locale : "en") as Locale;
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key;
      }
    }
    return result;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-50 items-center justify-center">
        <StoreImage
          src="/images/logo/logo-onepiece.png"
          alt="Authentication"
          width={600}
          height={800}
          className="object-cover h-full"
        />
      </div>

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {t('auth.verifyYourEmail')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.verificationCodeSent')} <span className="font-medium">{email}</span>
            </p>
          </div>

          <VerificationForm 
            email={email} 
            returnUrl={returnUrl} 
            fromCart={fromCart}
          />
        </div>
      </div>
    </div>
  );
} 