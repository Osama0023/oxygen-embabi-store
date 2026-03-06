/**
 * Check a product's current data in the database.
 * Usage: npx ts-node -T scripts/check-product.ts <productId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productId = process.argv[2] || 'cmhaxyjw00001kz04ny7ew45w';

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true, slug: true } },
      storages: {
        include: { units: true },
      },
    },
  });

  if (!product) {
    console.log('Product not found:', productId);
    process.exit(1);
  }

  console.log('\n=== Product in Database ===');
  console.log('ID:', product.id);
  console.log('Name:', product.name);
  console.log('Slug:', product.slug);
  console.log('Product Type:', product.productType);
  console.log('Updated At:', product.updatedAt.toISOString());
  console.log('');

  if (product.productType === 'SIMPLE') {
    console.log('Price (SIMPLE):', product.price != null ? Number(product.price) : null);
    console.log('Sale Price:', product.salePrice);
    console.log('Sale %:', product.sale);
    console.log('Sale End Date:', product.saleEndDate?.toISOString() ?? null);
  } else {
    console.log('STORAGE product - prices per storage:');
    for (const s of product.storages) {
      console.log(`  - ${s.size}: ${Number(s.price)} EGP`);
    }
  }

  console.log('\nDatabase has the latest data. Users may see cached data for up to 6 hours (page revalidate).');
  console.log('Product URL: /en/products/' + product.slug + ' (or /ar/products/' + product.slug + ')');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
