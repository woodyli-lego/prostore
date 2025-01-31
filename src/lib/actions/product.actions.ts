"use server";

import { prisma } from "@/db/prisma";
import { convertToPlainObject } from "../utils";
import { LATEST_PRODUCTS_LIMIT } from "../constants";

// 获取最新的商品
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: "desc" },
  });
  return convertToPlainObject(data);
}

// 根据 slug 获取商品
export async function getProductBySlug(slug: string) {
  const data = await prisma.product.findFirst({
    where: { slug: slug }
  });
  return convertToPlainObject(data);
}
