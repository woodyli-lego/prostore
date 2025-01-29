import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

const currency = z
  .string()
  .transform((value) => formatNumberWithDecimal(Number(value)))
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(value),
    "Currency must have exactly two decimal places"
  );

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: z.string().min(3, "Category must be at least 3 characters"),
  brand: z.string().min(3, "Brand must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  stock: z.coerce.number(),
  images: z.array(z.string().min(1, "Product must have at least one image")),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});
