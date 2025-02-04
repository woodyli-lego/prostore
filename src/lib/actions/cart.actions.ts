"use server";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError } from "../utils";
import { cookies } from "next/headers";
import { sessionCartIdKey } from "../constants";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema } from "../validators";

export async function addItemToCart(data: CartItem) {
  try {
    // 从 cookie 获取 sessionCartId
    const sessionCartId = (await cookies()).get(sessionCartIdKey)?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    // 从 session 获取 userId，如果是匿名用户，返回 undefined
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // 从数据库读取 user cart
    const cart = await getMyCart();

    // 校验入参
    const item = cartItemSchema.parse(data);

    // 从数据库读取 product
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    // TESTING
    console.log({
      "sessionCartId:": sessionCartId,
      'userId': userId,
      'item': item,
      'product': product,
    });

    return {
      success: true,
      message: "Item added to cart",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // 从 cookie 获取 sessionCartId
  const sessionCartId = (await cookies()).get(sessionCartIdKey)?.value;
  if (!sessionCartId) throw new Error("Cart session not found");

  // 从 session 获取 userId，如果是匿名用户，返回 undefined
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // 从数据库读取 user cart
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) return undefined;

  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}
