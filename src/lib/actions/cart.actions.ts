"use server";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { cookies } from "next/headers";
import { sessionCartIdKey } from "../constants";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

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
    if (!product) {
      throw new Error("Product not found");
    }

    if (!cart) {
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcPrice([item]),
      });

      await prisma.cart.create({
        data: newCart,
      });

    } else {
      // 检查 item 是否已经在 cart 中
      const existItem = (cart.items as CartItem[]).find((x) => x.productId === item.productId);
      if (existItem) {
        // 如果存在了，修改 qty 即可
        if (product.stock < existItem.qty + 1) {
          throw new Error("Not enough stock");
        }
        (cart.items as CartItem[]).find((x) => x.productId === item.productId)!.qty =
          existItem.qty + 1;
      } else {
        // 否则，把 item 加入 cart
        if (product.stock < 1) {
          throw new Error("Not enough stock");
        }
        cart.items.push(item);
      }

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });
    }

    // 重新生成 product page（以避免缓存问题）
    revalidatePath(`/product/${product.slug}`);

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
