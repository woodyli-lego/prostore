"use client";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { Cart, CartItem } from "@/types";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const handleAddToCart = async () => {
    const res = await addItemToCart(item);

    // Handle failure
    if (!res.success) {
      toast({
        variant: "destructive",
        description: res.message,
      });
      return;
    }

    // Handle success
    toast({
      description: res.message,
      action: (
        <ToastAction
          className="bg-primary text-white hover:bg-gray-800"
          altText="Go To Cart"
          onClick={() => router.push("/cart")}
        >
          Go to Cart
        </ToastAction>
      ),
    });
  };

  const handleRemoveFromCart = async () => {
    const res = await removeItemFromCart(item.productId);
    toast({
      variant: res.success ? "default" : "destructive",
      description: res.message,
    });
    return;
  };

  // 检查 item 是否已经在购物车中
  const existItem = cart && cart.items.find((x) => x.productId === item.productId);
  return existItem ? (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleRemoveFromCart}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="px-2">{existItem.qty}</span>
      <Button
        type="button"
        variant="outline"
        onClick={handleAddToCart}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <Button
      className="w-full"
      type="button"
      onClick={handleAddToCart}
    >
      <Plus />
      Add to Cart
    </Button>
  );
};

export default AddToCart;
