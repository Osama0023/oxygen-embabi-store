'use client';

import { translations } from '@/lib/translations';
import { useLocale } from '@/components/locale-provider';
import type { Locale } from '@/lib/i18n';

export function useTranslation() {
  const lang = useLocale();

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[lang];

    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }

    return value as string;
  };

  return { t, lang };
} 