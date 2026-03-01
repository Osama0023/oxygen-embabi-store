'use client';

import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function MaintenancePage() {
  const { t } = useTranslation();
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/maintenance')
      .then((r) => r.json())
      .then((data) => setMaintenanceMessage(data.maintenanceMessage || ''))
      .catch(() => setMaintenanceMessage(''));
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 bg-white dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
          <Wrench className="h-10 w-10 text-amber-600 dark:text-amber-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('maintenance.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {maintenanceMessage !== null ? (
            maintenanceMessage || t('maintenance.defaultMessage')
          ) : (
            <span className="animate-pulse">Loading...</span>
          )}
        </p>
      </div>
    </div>
  );
}
