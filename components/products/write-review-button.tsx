'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/use-translation';
import { ReviewForm } from './review-form';

interface WriteReviewButtonProps {
  productId: string;
  onSuccess?: () => void;
}

export function WriteReviewButton({ productId, onSuccess }: WriteReviewButtonProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setCanReview(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/reviews/can-review?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCanReview(data.canReview === true);
      })
      .catch(() => {
        if (!cancelled) setCanReview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, session?.user]);

  if (!session) return null;
  if (canReview === null) return null; // Loading
  if (!canReview) return null;

  if (showForm) {
    return (
      <div id="review-form" className="mt-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('productDetail.writeReviewHeading')}
        </h3>
        <ReviewForm productId={productId} onSuccess={() => { setShowForm(false); onSuccess?.(); }} />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="px-6 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
      onClick={() => setShowForm(true)}
    >
      {t('productDetail.writeReview')}
    </button>
  );
}
