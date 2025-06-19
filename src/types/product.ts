import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  price: z.number(),
  category: z.string(),
  subcategory: z.string().optional(),
  merchant: z.string().optional(),
  color: z.string(),
  size: z.string(),
  images: z.array(z.string()),
  description: z.string(),
  specialOffer: z.boolean().optional().default(false),
  discountPercentage: z.number().optional(),
  offerEndsAt: z.string().optional(),
  isArchived: z.boolean(),
  createdAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  expirationDate: z.string().optional(),
  wholesaleInfo: z
    .object({
      supplierName: z.string(),
      supplierPhone: z.string(),
      supplierEmail: z.string(),
      supplierLocation: z.string(),
      purchasePrice: z.number(),
      minimumOrderQuantity: z.number(),
      notes: z.string().optional(),
    })
    .optional(),
  sizesWithPrices: z
    .array(
      z.object({
        size: z.string(),
        price: z.string(),
      })
    )
    .optional(),
  extras: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
      })
    )
    .optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const FilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  supplier: z.string().optional(),
  sortBy: z
    .enum(["price-asc", "price-desc", "name-asc", "name-desc"])
    .optional(),
});

export type Filter = z.infer<typeof FilterSchema>;
