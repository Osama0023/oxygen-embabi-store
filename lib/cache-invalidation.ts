import { revalidatePath } from "next/cache";

type ProductInvalidationInput = {
  slug?: string | null;
  categorySlug?: string | null;
  previousCategorySlug?: string | null;
};

/**
 * Invalidate all storefront pages that can display product prices/stock.
 * Keep this centralized so admin/product mutations stay consistent.
 */
export function invalidateProductCaches(input: ProductInvalidationInput = {}): void {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/products", "page");
  revalidatePath("/[locale]/deals", "page");
  revalidatePath("/[locale]/categories", "page");
  revalidatePath("/[locale]/brands/[brand]", "page");

  if (input.slug) {
    revalidatePath("/[locale]/products/[slug]", "page");
  }

  if (input.categorySlug) {
    revalidatePath("/[locale]/categories/[slug]", "page");
  }

  if (input.previousCategorySlug && input.previousCategorySlug !== input.categorySlug) {
    revalidatePath("/[locale]/categories/[slug]", "page");
  }
}
