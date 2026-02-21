'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { locales } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    if (currentLocale === newLocale) return;
    setIsOpen(false);

    // pathname is like /en/products or /ar/categories/foo - replace locale segment
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleIndex = locales.indexOf(currentLocale);
    if (currentLocaleIndex >= 0 && segments[0] === currentLocale) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  const dropdownPosition = currentLocale === 'ar' ? 'left-0' : 'right-0';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-700 hover:text-black"
        aria-label="Switch language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{currentLocale.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className={`absolute ${dropdownPosition} mt-2 w-32 bg-white rounded-md shadow-lg z-50`}>
          <div className="py-1">
            <button
              onClick={() => switchLocale('en')}
              className={`block px-4 py-2 text-sm w-full text-left hover:text-black ${
                currentLocale === 'en'
                  ? 'bg-gray-100 font-medium text-black'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              English
            </button>
            <button
              onClick={() => switchLocale('ar')}
              className={`block px-4 py-2 text-sm w-full text-left hover:text-black ${
                currentLocale === 'ar'
                  ? 'bg-gray-100 font-medium text-black'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
