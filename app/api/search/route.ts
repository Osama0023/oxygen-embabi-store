import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductDisplayPrice } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          sale: true,
          saleEndDate: true,
          stock: true,
          images: true,
          thumbnails: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          storages: {
            select: {
              id: true,
              size: true,
              price: true,
              salePercentage: true,
              saleEndDate: true,
              units: {
                select: {
                  stock: true,
                  taxStatus: true,
                  taxType: true,
                  taxAmount: true,
                  taxPercentage: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
      prisma.category.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
        take: 5,
      }),
    ]);

    // Use getProductDisplayPrice for correct pricing (handles SIMPLE and STORAGE products)
    const formattedProducts = products.map((product) => {
      const isOutOfStock =
        product.storages.length > 0
          ? product.storages.every((s) => s.units.every((u) => u.stock <= 0))
          : (product.stock ?? 0) <= 0;

      if (isOutOfStock) {
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: null,
          images: product.images,
          thumbnails: product.thumbnails,
          category: product.category,
        };
      }

      const display = getProductDisplayPrice({
        price: product.price != null ? Number(product.price) : null,
        salePrice: product.salePrice ?? null,
        sale: product.sale ?? null,
        saleEndDate: product.saleEndDate?.toISOString() ?? null,
        storages: product.storages.map((s) => ({
          id: s.id,
          size: s.size,
          price: Number(s.price),
          salePercentage: s.salePercentage ?? null,
          saleEndDate: s.saleEndDate?.toISOString() ?? null,
          units: s.units.map((u) => ({
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
            taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
          })),
        })),
      });
      const effectivePrice = display.salePrice ?? display.price;
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: String(effectivePrice),
        images: product.images,
        thumbnails: product.thumbnails,
        category: product.category,
      };
    });

    const response = NextResponse.json({ 
      products: formattedProducts, 
      categories 
    });
    
    // Add caching headers - cache for 30 seconds (search results change frequently but can be cached briefly)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 